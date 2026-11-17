#ifndef LOTTIEX_PROXY_HPP
#define LOTTIEX_PROXY_HPP

#pragma once

#include <lottiex/config.hpp>
#include <lottiex/connection.hpp>

#include <array>
#include <memory>

namespace lottiex {

inline bool hop_header(const httplib::Headers& headers, const std::string& name) {
    constexpr std::string_view names[] = {
        "connection", "keep-alive", "proxy-connection", "proxy-authenticate",
        "proxy-authorization", "proxy-authentication-info", "te", "trailer",
        "transfer-encoding", "upgrade", "content-length"
    };

    return std::find(std::begin(names), std::end(names), name) != std::end(names) ||
           httplib::detail::has_header_token(headers, "Connection", name.c_str());
}

inline bool read_request_body(const ServerConfig& config, const httplib::Request& request,
                              httplib::Response& response, Connection& connection, std::string& body) {
    const bool has_length = request.has_header("Content-Length");
    if (!has_length && !request.has_header("Transfer-Encoding")) return true;

    if (has_length) {
        const auto length = request.get_header_value_u64("Content-Length");
        if (length > config.max_body_bytes) {
            respond(response, 413);
            return false;
        }

        if (!length) return true;
        body.reserve(length);
    }

    auto& stream = connection.stream;
    if (httplib::detail::has_header_token(request.headers, "Expect", "100-continue")) {
        constexpr std::string_view reply = "HTTP/1.1 100 Continue\r\n\r\n";
        if (!httplib::detail::write_data(stream, reply.data(), reply.size())) {
            respond(response, 400);
            return false;
        }
    }

    httplib::Request framed;
    framed.headers = request.headers;
    int status = 400;
    if (!httplib::detail::read_content(stream, framed, config.max_body_bytes, status, nullptr,
        [&body](const char* data, std::size_t size, std::size_t, std::size_t) {
            body.append(data, size);
            return true;
        }, false)) {
        respond(response, stream.get_error() == httplib::Error::Timeout ? 408 : status);
        return false;
    }

    return true;
}

inline httplib::Headers proxy_request_headers(const ServerConfig& config, const httplib::Request& request,
                                              const Connection& connection, std::size_t length) {
    httplib::Headers headers;

    for (const auto& [key, value] : request.headers) {
        const auto name = lower(key);
        if (hop_header(request.headers, name) || name.starts_with("x-forwarded-") ||
            name == "forwarded" || name == "x-real-ip" || name == "host" ||
            name == "expect" || name == "x-request-id") continue;

        headers.emplace(key, value);
    }

    const auto host = request.get_header_value("Host");
    const bool trusted = std::find(config.trusted_proxies.begin(), config.trusted_proxies.end(),
                                   request.remote_addr) != config.trusted_proxies.end();
    auto peer = request.remote_addr;
    auto scheme = "http";

    if (trusted) {
        const auto forwarded = request.get_header_value("X-Forwarded-For");
        if (request.get_header_value_count("X-Forwarded-For") == 1 && numeric_ip(forwarded)) {
            peer = forwarded;
        }

        if (request.get_header_value_count("X-Forwarded-Proto") == 1 &&
            request.get_header_value("X-Forwarded-Proto") == "https") scheme = "https";
    }

    const auto colon = host.rfind(':');
    const auto bracket = host.rfind(']');
    const bool has_port = colon != std::string::npos && (bracket == std::string::npos || colon > bracket);
    const auto port = has_port ? host.substr(colon + 1) : (std::string_view(scheme) == "https" ? "443" : "80");

    headers.emplace("Host", host);
    headers.emplace("X-Forwarded-Host", host);
    headers.emplace("X-Forwarded-For", peer);
    headers.emplace("X-Forwarded-Proto", scheme);
    headers.emplace("X-Forwarded-Port", port);
    headers.emplace("X-Request-Id", connection.id);
    headers.emplace("Connection", "close");

    if (length || request.has_header("Content-Length") || request.has_header("Transfer-Encoding")) {
        headers.emplace("Content-Length", std::to_string(length));
    }

    return headers;
}

inline std::string upstream_target(const Route& route, std::string_view target) {
    if (!route.strip_prefix) return std::string(target);

    target.remove_prefix(route.path.size());
    if (target.empty() || target.front() == '?') return "/" + std::string(target);

    return std::string(target);
}

inline void proxy_error(const Connection& connection, httplib::Error error) {
    std::osyncstream(std::cerr) << "request_id=" << connection.id << " upstream=" << connection.upstream
                                << " error=" << httplib::to_string(error) << '\n';
}

class UpstreamConnection {
    Listener& listener;
    socket_t socket;
    socket_t downstream;
    httplib::detail::SocketStream stream;
    httplib::detail::BodyReader reader;
    bool attached;

    bool downstream_closed() const {
        pollfd client{downstream, POLLRDHUP, 0};
        return poll(&client, 1, 0) > 0 &&
               (client.revents & (POLLRDHUP | POLLHUP | POLLERR | POLLNVAL));
    }

public:
    UpstreamConnection(Listener& server, socket_t sock, const ServerConfig& config, socket_t client)
        : listener(server), socket(sock), downstream(client), stream(sock, config.upstream_read_seconds, 0,
          config.upstream_write_seconds, 0), attached(false) {
        reader.stream = &stream;
        attached = listener.attach(socket);
    }

    ~UpstreamConnection() {
        if (attached) listener.detach(socket);
        httplib::detail::close_socket(socket);
    }

    UpstreamConnection(const UpstreamConnection&) = delete;
    UpstreamConnection& operator=(const UpstreamConnection&) = delete;

    static std::shared_ptr<UpstreamConnection> open(Listener& listener, const ServerConfig& config,
                                                    const Upstream& upstream, socket_t downstream,
                                                    httplib::Error& error) {
        const auto socket = httplib::detail::create_client_socket(upstream.host, {}, upstream.port,
            AF_UNSPEC, true, false, nullptr, config.upstream_connect_seconds, 0,
            config.upstream_read_seconds, 0, config.upstream_write_seconds, 0, {}, error);
        if (socket == INVALID_SOCKET) return {};

        try {
            return std::make_shared<UpstreamConnection>(listener, socket, config, downstream);
        } catch (...) {
            httplib::detail::close_socket(socket);
            throw;
        }
    }

    httplib::Error exchange(const ServerConfig& config, const httplib::Request& request,
                            const std::string& target, const httplib::Headers& headers,
                            std::string_view body, httplib::Response& result) {
        if (!attached) return httplib::Error::ConnectionClosed;

        httplib::detail::BufferStream head;
        if (httplib::detail::write_request_line(head, request.method, target) < 0 ||
            httplib::detail::write_headers(head, headers) <= 0) return httplib::Error::Write;

        for (auto data : {std::string_view(head.get_buffer()), body}) {
            while (!data.empty()) {
                const auto ready = httplib::detail::select_write(socket, config.upstream_write_seconds, 0);
                if (ready == 0) return httplib::Error::Timeout;
                if (ready < 0) return httplib::Error::Write;

                const auto sent = send(socket, data.data(), data.size(), MSG_DONTWAIT | MSG_NOSIGNAL);
                if (sent < 0 && errno == EINTR) continue;
                if (sent <= 0) return httplib::Error::Write;
                data.remove_prefix(static_cast<std::size_t>(sent));
            }
        }

        for (int i = 0; i < 8; ++i) {
            result.status = -1;
            result.headers.clear();
            if (!httplib::detail::read_response_head(stream, result.status, result.headers)) {
                const auto error = stream.get_error();
                return error == httplib::Error::Success ? httplib::Error::HTTPParsing : error;
            }

            if (result.status >= 200 && result.status <= 599) return httplib::Error::Success;
            if (result.status < 100 || result.status == 101) break;
        }

        return httplib::Error::HTTPParsing;
    }

    void frame(bool chunked, bool known_length, std::size_t length) {
        reader.chunked = chunked;
        reader.has_content_length = known_length;
        reader.content_length = length;

        if (!known_length) stream.set_read_interrupt([this] { return downstream_closed(); });
    }

    bool copy_buffered_body(std::size_t length, std::string& output) const {
        std::size_t buffered = 0;
        const auto* data = stream.buffered_data(buffered);
        if (length > buffered) return false;

        output.assign(data, length);
        return true;
    }

    ssize_t read(char* data, std::size_t length, const httplib::Headers& headers) {
        const auto count = reader.read(data, length);
        if (count == 0 && reader.chunked) {
            httplib::Headers trailers;
            if (!reader.chunked_decoder->parse_trailers_into(trailers, headers)) return -1;
        }

        return count;
    }

    httplib::Error read_error() const {
        if (!reader.has_error()) return httplib::Error::HTTPParsing;
        if (reader.last_error == httplib::Error::Timeout && downstream_closed()) {
            return httplib::Error::ConnectionClosed;
        }

        return reader.last_error;
    }
};

inline void proxy_request(Listener& listener, const ServerConfig& config, const Route& route,
                          const httplib::Request& request, httplib::Response& response, Connection& connection) {
    connection.upstream = route.upstream;
    std::string body;
    if (!read_request_body(config, request, response, connection, body)) return;

    const auto headers = proxy_request_headers(config, request, connection, body.size());
    auto error = httplib::Error::Success;
    auto upstream = UpstreamConnection::open(listener, config, config.upstreams.at(route.upstream),
                                             connection.stream.socket(), error);

    httplib::Response result;
    if (upstream) error = upstream->exchange(config, request, upstream_target(route, request.target),
                                             headers, body, result);
    if (error != httplib::Error::Success) {
        proxy_error(connection, error);
        return respond(response, error == httplib::Error::ConnectionTimeout ||
                                  error == httplib::Error::Timeout ? 504 : 502);
    }

    const bool chunked = result.has_header("Transfer-Encoding");
    const bool known_length = result.has_header("Content-Length");
    bool invalid_length = false;
    const auto length = httplib::detail::get_header_value_u64(result.headers, "Content-Length", 0, 0, invalid_length);

    if (invalid_length || result.get_header_value_count("Content-Length") > 1 ||
        (chunked && (known_length || result.get_header_value_count("Transfer-Encoding") != 1 ||
         lower(result.get_header_value("Transfer-Encoding")) != "chunked"))) {
        proxy_error(connection, httplib::Error::HTTPParsing);
        return respond(response, 502);
    }

    connection.proxied = true;
    response.status = result.status;

    const bool has_body = request.method != "HEAD" && httplib::detail::body_allowed_for_status(result.status);
    const bool buffered = has_body && known_length && length && upstream->copy_buffered_body(length, response.body);
    if (has_body && !buffered && (!known_length || length)) {
        upstream->frame(chunked, known_length, length);
        const auto content_type = result.get_header_value("Content-Type");
        auto transfer = [upstream, &connection, known_length,
                         framing = chunked ? result.headers : httplib::Headers{}]
                        (std::size_t, std::size_t maximum, httplib::DataSink& sink) {
            std::array<char, 65536> chunk;
            const auto count = upstream->read(chunk.data(), std::min(maximum, chunk.size()), framing);
            if (count < 0 || (count == 0 && known_length)) {
                proxy_error(connection, upstream->read_error());
                return false;
            }

            if (count == 0) {
                sink.done();
                return true;
            }

            if (!sink.write(chunk.data(), static_cast<std::size_t>(count))) return false;

            connection.bytes += static_cast<std::size_t>(count);
            return true;
        };

        if (known_length) {
            response.set_content_provider(length, content_type, std::move(transfer));
        } else {
            response.set_chunked_content_provider(content_type,
                [transfer = std::move(transfer)](std::size_t offset, httplib::DataSink& sink) {
                    return transfer(offset, 65536, sink);
                });
        }

        response.headers.erase("Content-Type");
    }

    for (const auto& [key, value] : result.headers) {
        const auto name = lower(key);
        if (name == "x-request-id" || name == "server") continue;
        if (hop_header(result.headers, name) && !(request.method == "HEAD" && name == "content-length")) continue;

        response.headers.emplace(key, value);
    }
}

}

#endif
