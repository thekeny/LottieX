#ifndef LOTTIEX_SERVER_HPP
#define LOTTIEX_SERVER_HPP

#pragma once

#include <lottiex/config.hpp>
#include <lottiex/http.hpp>
#include <cpp-httplib/httplib.h>

#include <array>
#include <atomic>
#include <cerrno>
#include <csignal>
#include <iostream>
#include <limits>
#include <memory>
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
    httplib::Server server;
    class RequestQueue : public httplib::TaskQueue {
        Server& owner;
        httplib::ThreadPool workers{8, 8, 64};

    public:
        explicit RequestQueue(Server& server) : owner(server) {}

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

    bool inside_root(const std::filesystem::path& path) const {
        auto part = path.begin();

        for (const auto& root_part : config.root) {
            if (part == path.end() || *part++ != root_part) return false;
        }

        return true;
    }

    static void respond(httplib::Response& response, int status) {
        response.status = status;
        response.set_content(std::string(httplib::status_message(status)) + "\n", "text/plain; charset=utf-8");

        if (status == 405) response.set_header("Allow", "GET, HEAD");
    }

    void handle(const httplib::Request& request, httplib::Response& response) const {
        if (request.version != "HTTP/1.1" || request.get_header_value_count("Host") != 1 ||
            request.get_header_value("Host").find_first_not_of(" \t") == std::string::npos ||
            request.has_header("Transfer-Encoding") ||
            (request.has_header("Content-Length") && request.get_header_value("Content-Length") != "0")) {
            return respond(response, 400);
        }

        if (request.method != "GET" && request.method != "HEAD") return respond(response, 405);
        std::string decoded;

        if (!decode_path(request.target, decoded)) return respond(response, 400);
        if (!config.static_enabled) return respond(response, 404);

        try {
            const std::filesystem::path relative(decoded.substr(1));

            for (const auto& part : relative) {
                if (part == "..") return respond(response, 404);
            }

            auto path = std::filesystem::weakly_canonical(config.root / relative);
            if (!inside_root(path)) return respond(response, 404);

            if (std::filesystem::is_directory(path)) {
                path = std::filesystem::weakly_canonical(path / config.index);
            }

            if (!inside_root(path) || !std::filesystem::is_regular_file(path)) return respond(response, 404);

            auto file = std::make_shared<std::ifstream>(path, std::ios::binary);
            if (!*file) return respond(response, 500);

            const auto size = std::filesystem::file_size(path);
            if (size > std::numeric_limits<std::size_t>::max()) return respond(response, 500);

            response.status = 200;
            response.set_content_provider(static_cast<std::size_t>(size), mime_type(path.extension().string()),
                [file](std::size_t offset, std::size_t length, httplib::DataSink& sink) {
                    std::array<char, 65536> chunk{};
                    const auto count = static_cast<std::streamsize>(std::min(length, chunk.size()));

                    file->seekg(static_cast<std::streamoff>(offset));
                    file->read(chunk.data(), count);
                    if (file->gcount() != count) return false;

                    return sink.write(chunk.data(), static_cast<std::size_t>(count));
                });
        } catch (const std::filesystem::filesystem_error& error) {
            std::osyncstream(std::cerr) << "Static file error: " << error.what() << '\n';
            respond(response, 500);
        }
    }

public:
    explicit Server(ServerConfig settings) : config(std::move(settings)) {
        server.new_task_queue = [this] { return new RequestQueue(*this); };

        server.set_socket_options([](socket_t socket) {
            httplib::set_socket_opt(socket, SOL_SOCKET, SO_REUSEADDR, 1);
        });

        server.set_address_family(config.host.find(':') == std::string::npos ? AF_INET : AF_INET6);
        server.set_default_headers({{"Server", "LottieX"}, {"Connection", "close"}});

        server.set_read_timeout(30);
        server.set_write_timeout(30);
        server.set_keep_alive_max_count(1);

        server.set_pre_routing_handler([this](const httplib::Request& request, httplib::Response& response) {
            handle(request, response);
            return httplib::Server::HandlerResponse::Handled;
        });

        server.set_error_handler([](const httplib::Request&, httplib::Response& response) {
            if (response.body.empty()) respond(response, response.status);
        });

        server.set_exception_handler([](const httplib::Request&, httplib::Response& response, std::exception_ptr) {
            std::osyncstream(std::cerr) << "Request handler failed\n";
            respond(response, 500);
        });

        server.set_logger([](const httplib::Request& request, const httplib::Response& response) {
            std::osyncstream(std::cout) << request.method << ' ' << request.target << ' ' << response.status << std::endl;
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
                while (!token.stop_requested()) {
                    const timespec timeout{0, 100000000};
                    const int signal = sigtimedwait(&signals, nullptr, &timeout);

                    if (signal == SIGINT || signal == SIGTERM) {
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
                        if (pending_requests == 0) server.stop();
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
