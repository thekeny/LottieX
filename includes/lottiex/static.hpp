#ifndef LOTTIEX_STATIC_HPP
#define LOTTIEX_STATIC_HPP

#pragma once

#include <lottiex/config.hpp>
#include <lottiex/connection.hpp>

#include <array>
#include <limits>
#include <memory>

namespace lottiex {

inline bool inside_root(const std::filesystem::path& root, const std::filesystem::path& path) {
    auto part = path.begin();

    for (const auto& root_part : root) {
        if (part == path.end() || *part++ != root_part) return false;
    }

    return true;
}

inline void serve_static(const ServerConfig& config, std::string_view decoded,
                         httplib::Response& response, Connection& connection) {
    if (!config.static_enabled) return respond(response, 404);

    try {
        const std::filesystem::path relative(decoded.substr(1));

        for (const auto& part : relative) {
            if (part != "." && part.native().starts_with('.')) return respond(response, 404);
        }

        auto path = std::filesystem::weakly_canonical(config.root / relative);
        if (!inside_root(config.root, path)) return respond(response, 404);

        auto status = std::filesystem::status(path);
        if (std::filesystem::is_directory(status)) {
            path = std::filesystem::weakly_canonical(path / config.index);
            if (!inside_root(config.root, path)) return respond(response, 404);

            status = std::filesystem::status(path);
        }

        if (path == config.source || !std::filesystem::is_regular_file(status)) return respond(response, 404);

        for (const auto& part : path.lexically_relative(config.root)) {
            if (part.native().starts_with('.')) return respond(response, 404);
        }

        auto file = std::make_shared<std::ifstream>(path, std::ios::binary);
        if (!*file) return respond(response, 500);

        const auto size = std::filesystem::file_size(path);
        if (size > std::numeric_limits<std::size_t>::max()) return respond(response, 500);

        response.status = 200;
        response.set_content_provider(static_cast<std::size_t>(size), mime_type(path.extension().string()),
            [file, &connection](std::size_t offset, std::size_t length, httplib::DataSink& sink) {
                std::array<char, 65536> chunk;
                const auto count = static_cast<std::streamsize>(std::min(length, chunk.size()));

                file->seekg(static_cast<std::streamoff>(offset));
                file->read(chunk.data(), count);
                if (file->gcount() != count) return false;

                if (!sink.write(chunk.data(), static_cast<std::size_t>(count))) return false;

                connection.bytes += static_cast<std::size_t>(count);
                return true;
            });
    } catch (const std::filesystem::filesystem_error& error) {
        std::osyncstream(std::cerr) << "request_id=" << connection.id << " static file error: "
                                    << error.code().message() << '\n';
        respond(response, 500);
    }
}

}

#endif
