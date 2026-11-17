#ifndef LOTTIEX_CONNECTION_HPP
#define LOTTIEX_CONNECTION_HPP

#pragma once

#include <cpp-httplib/httplib.h>

#include <atomic>
#include <chrono>
#include <ctime>
#include <iomanip>
#include <iostream>
#include <mutex>
#include <set>
#include <syncstream>

namespace lottiex {

using Clock = std::chrono::steady_clock;

inline void respond(httplib::Response& response, int status) {
    response.status = status;
    response.set_content(std::string(httplib::status_message(status)) + "\n", "text/plain; charset=utf-8");
}

struct Connection {
    httplib::Stream& stream;
    std::string id;
    Clock::time_point started;
    std::string method;
    std::string path;
    std::string upstream;
    int status = 0;
    std::size_t bytes = 0;
    bool proxied = false;

    void log() const {
        if (!status) return;

        const auto now = std::time(nullptr);
        std::tm utc{};
        gmtime_r(&now, &utc);
        const auto elapsed = std::chrono::duration_cast<std::chrono::microseconds>(Clock::now() - started);

        std::osyncstream(std::cout) << std::put_time(&utc, "%FT%TZ")
            << " request_id=" << id << " method=" << method << " path=" << path
            << " status=" << status << " duration_us=" << elapsed.count()
            << " bytes=" << bytes << " upstream=" << (upstream.empty() ? "-" : upstream) << '\n';
    }
};

class Listener : public httplib::Server {
    std::mutex sockets_mutex;
    std::set<socket_t> sockets;
    bool expired = false;
    std::function<void(httplib::Request&)> setup_request;
    std::atomic<unsigned long> next_id{1};

    static inline thread_local Connection* current_connection = nullptr;

    bool process_and_close_socket(socket_t socket) override {
        if (!attach(socket)) {
            httplib::detail::close_socket(socket);
            return false;
        }

        const auto result = serve_guarded([&] {
            std::string remote, local;
            int remote_port = 0, local_port = 0;
            httplib::detail::get_remote_ip_and_port(socket, remote, remote_port);
            httplib::detail::get_local_ip_and_port(socket, local, local_port);

            return httplib::detail::process_server_socket(
                svr_sock_, socket, keep_alive_max_count_, keep_alive_timeout_sec_,
                read_timeout_sec_, read_timeout_usec_, write_timeout_sec_, write_timeout_usec_,
                [&](httplib::Stream& stream, bool close, bool& closed) {
                    Connection data{stream, std::to_string(next_id++), Clock::now(), {}, {}, {}};
                    current_connection = &data;

                    const auto success = serve_guarded([&] {
                        return process_request(stream, remote, remote_port, local, local_port, close, closed, setup_request);
                    });

                    current_connection = nullptr;
                    data.log();
                    return success;
                });
        });

        detach(socket);
        httplib::detail::drain_and_close_socket(socket);
        return result;
    }

public:
    void set_request_setup(std::function<void(httplib::Request&)> setup) {
        setup_request = std::move(setup);
    }

    static Connection& connection() { return *current_connection; }

    bool attach(socket_t socket) {
        std::lock_guard lock(sockets_mutex);
        if (expired) return false;
        sockets.insert(socket);
        return true;
    }

    void detach(socket_t socket) {
        std::lock_guard lock(sockets_mutex);
        sockets.erase(socket);
    }

    void expire() {
        std::lock_guard lock(sockets_mutex);
        expired = true;

        for (const auto socket : sockets) {
            httplib::detail::shutdown_socket(socket);
        }
    }
};

}

#endif
