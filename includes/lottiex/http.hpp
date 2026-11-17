#ifndef LOTTIEX_HTTP_HPP
#define LOTTIEX_HTTP_HPP

#pragma once

#include <algorithm>
#include <cctype>
#include <string>
#include <string_view>

namespace lottiex {

inline constexpr const char* VERSION = "0.1.0";

inline std::string lower(std::string value) {
    for (auto& c : value) {
        c = static_cast<char>(std::tolower(static_cast<unsigned char>(c)));
    }

    return value;
}

inline bool decode_path(std::string_view target, std::string& path) {
    target = target.substr(0, target.find('?'));
    if (target.empty() || target.front() != '/') {
        return false;
    }

    auto hex = [](char c) -> int {
        if (c >= '0' && c <= '9') {
            return c - '0';
        }

        if (c >= 'a' && c <= 'f') {
            return c - 'a' + 10;
        }

        if (c >= 'A' && c <= 'F') {
            return c - 'A' + 10;
        }

        return -1;
    };

    for (std::size_t i = 0; i < target.size(); ++i) {
        unsigned char c = target[i];
        if (c == '%') {
            if (i + 2 >= target.size()) {
                return false;
            }

            const int a = hex(target[i + 1]), b = hex(target[i + 2]);
            if (a < 0 || b < 0) {
                return false;
            }

            c = static_cast<unsigned char>(a * 16 + b);
            i += 2;
        }

        if (c < 32 || c == 127 || c == '\\' || c == '#') {
            return false;
        }

        path += static_cast<char>(c);
    }

    return true;
}

inline std::string mime_type(const std::string& extension) {
    const auto ext = lower(extension);

    if (ext == ".html" || ext == ".htm") {
        return "text/html; charset=utf-8";
    }

    if (ext == ".css") {
        return "text/css; charset=utf-8";
    }

    if (ext == ".js") {
        return "text/javascript; charset=utf-8";
    }

    if (ext == ".json") {
        return "application/json";
    }

    if (ext == ".png") {
        return "image/png";
    }

    if (ext == ".jpg" || ext == ".jpeg") {
        return "image/jpeg";
    }

    if (ext == ".svg") {
        return "image/svg+xml";
    }

    if (ext == ".txt") {
        return "text/plain; charset=utf-8";
    }

    if (ext == ".ico") {
        return "image/x-icon";
    }

    return "application/octet-stream";
}

}

#endif
