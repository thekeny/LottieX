#ifndef LOTTIEX_SERVER_HPP
#define LOTTIEX_SERVER_HPP

#pragma once

#include <lottiex/config.hpp>
#include <lottiex/proxy.hpp>
#include <lottiex/static.hpp>

#include <atomic>
#include <cerrno>
#include <csignal>
#include <iostream>
#include <mutex>
#include <pthread.h>
#include <syncstream>
#include <thread>

namespace lottiex {

class Server {
    ServerConfig config;
    std::mutex requests_mutex;
    std::size_t pending_requests = 0;
    bool draining = false;
    Listener server;
    class RequestQueue : public httplib::TaskQueue {
        Server& owner;
        httplib::ThreadPool workers;

    public:
        explicit RequestQueue(Server& server)
            : owner(server), workers(server.config.workers, server.config.workers, server.config.queue) {}

        bool enqueue(std::function<void()> job) override {
            std::lock_guard lock(owner.requests_mutex);

            if (owner.draining) return false;

            ++owner.pending_requests;

            try {
                if (workers.enqueue([this, job = std::move(job)] {
                    struct Completion {
                        Server& owner;

                        ~Completion() {
                            std::lock_guard lock(owner.requests_mutex);
                            --owner.pending_requests;
                        }
                    } completion{owner};

                    job();
                })) return true;
            } catch (...) {
                --owner.pending_requests;
                throw;
            }

            --owner.pending_requests;
            return false;
        }

        void shutdown() override { workers.shutdown(); }
    };

    void handle(const httplib::Request& request, httplib::Response& response) {
        auto& connection = Listener::connection();
        response.set_header("X-Request-Id", connection.id);

        if (request.version != "HTTP/1.1" || request.get_header_value_count("Host") != 1 ||
            request.get_header_value_count("Content-Length") > 1 ||
            (request.has_header("Transfer-Encoding") && request.has_header("Content-Length"))) {
            return respond(response, 400);
        }

        if (request.target.size() > config.max_target_bytes) return respond(response, 414);

        std::size_t header_bytes = 0;
        for (const auto& [name, value] : request.headers) {
            header_bytes += name.size() + value.size() + 4;
        }

        if (header_bytes > config.max_header_bytes) return respond(response, 431);

        const auto target = std::string_view(request.target).substr(0, request.target.find('?'));
        const auto* route = match_route(config.routes, target);
        const bool proxy = route && !route->upstream.empty();

        if (!proxy && (request.has_header("Transfer-Encoding") ||
            (request.has_header("Content-Length") && request.get_header_value("Content-Length") != "0"))) {
            return respond(response, 400);
        }

        const bool read = request.method == "GET" || request.method == "HEAD";
        const bool api_method = request.method == "POST" || request.method == "PUT" ||
            request.method == "PATCH" || request.method == "DELETE" || request.method == "OPTIONS";

        if (!read && !(proxy && api_method)) {
            response.set_header("Allow", proxy ? "GET, HEAD, POST, PUT, PATCH, DELETE, OPTIONS" : "GET, HEAD");
            return respond(response, 405);
        }

        std::string decoded;
        if (!decode_path(request.target, decoded)) return respond(response, 400);

        if (proxy) return proxy_request(server, config, *route, request, response, connection);

        serve_static(config, decoded, response, connection);
    }

public:
    explicit Server(ServerConfig settings) : config(std::move(settings)) {
        server.new_task_queue = [this] { return new RequestQueue(*this); };

        server.set_socket_options([](socket_t socket) {
            httplib::set_socket_opt(socket, SOL_SOCKET, SO_REUSEADDR, 1);
        });

        server.set_address_family(config.host.find(':') == std::string::npos ? AF_INET : AF_INET6);
        server.set_default_headers({{"Server", "LottieX"}, {"Connection", "close"}});

        server.set_read_timeout(config.client_read_seconds);
        server.set_write_timeout(config.client_write_seconds);
        server.set_keep_alive_max_count(1);

        server.set_request_setup([this](httplib::Request& request) {
            if (request.ranges.empty()) return;

            const auto target = std::string_view(request.target).substr(0, request.target.find('?'));
            const auto* route = match_route(config.routes, target);
            if (route && !route->upstream.empty()) request.ranges.clear();
        });

        server.set_pre_routing_handler([this](const httplib::Request& request, httplib::Response& response) {
            handle(request, response);
            return httplib::Server::HandlerResponse::Handled;
        });

        server.set_error_handler([](const httplib::Request&, httplib::Response& response) {
            const auto& connection = Listener::connection();
            if (!response.has_header("X-Request-Id")) response.set_header("X-Request-Id", connection.id);
            if (!connection.proxied && response.body.empty()) respond(response, response.status);
        });

        server.set_exception_handler([](const httplib::Request&, httplib::Response& response, std::exception_ptr) {
            std::osyncstream(std::cerr) << "request_id=" << Listener::connection().id << " request handler failed\n";
            respond(response, 500);
        });

        server.set_logger([](const httplib::Request& request, const httplib::Response& response) {
            auto& connection = Listener::connection();
            connection.method = request.method;
            connection.path = request.target.substr(0, request.target.find('?'));
            connection.status = response.status;
            if (request.method != "HEAD") connection.bytes = response.body.size();
        });
    }

    void run() {
        sigset_t signals, previous;
        sigemptyset(&signals);
        sigaddset(&signals, SIGINT);
        sigaddset(&signals, SIGTERM);

        if (pthread_sigmask(SIG_BLOCK, &signals, &previous) != 0) {
            throw std::runtime_error("Cannot block termination signals");
        }

        struct RestoreMask {
            sigset_t previous;

            ~RestoreMask() { pthread_sigmask(SIG_SETMASK, &previous, nullptr); }
        } restore{previous};

        if (!server.bind_to_port(config.host, config.port)) {
            throw std::runtime_error("Cannot listen on " + config.host + ':' + std::to_string(config.port));
        }

        std::atomic<bool> stopping = false;
        std::jthread signal_thread;

        try {
            signal_thread = std::jthread([this, signals, &stopping](std::stop_token token) {
                auto deadline = Clock::time_point::max();

                while (!token.stop_requested()) {
                    const timespec timeout{0, 100000000};
                    const int signal = sigtimedwait(&signals, nullptr, &timeout);

                    if (signal == SIGINT || signal == SIGTERM) {
                        if (!stopping && !config.upstreams.empty()) {
                            deadline = Clock::now() + std::chrono::seconds(config.drain_seconds);
                        }

                        stopping = true;
                        std::lock_guard lock(requests_mutex);
                        draining = true;
                    } else if (signal < 0 && errno != EAGAIN && errno != EINTR) {
                        std::osyncstream(std::cerr) << "Signal wait failed\n";
                        server.stop();
                        return;
                    }

                    if (stopping) {
                        std::lock_guard lock(requests_mutex);
                        if (pending_requests == 0) {
                            server.stop();
                            return;
                        }

                        if (Clock::now() >= deadline) {
                            server.expire();
                            deadline = Clock::time_point::max();
                        }
                    }
                }
            });

            std::cout << "LottieX " << VERSION << " listening on " << config.host << ':' << config.port << std::endl;
            const bool success = server.listen_after_bind();

            if (!success && !stopping) throw std::runtime_error("HTTP server failed");
        } catch (...) {
            server.stop();
            throw;
        }
    }
};

}

#endif
