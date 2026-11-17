#ifndef LOTTIEX_ROUTES_HPP
#define LOTTIEX_ROUTES_HPP

#pragma once

#include <lottiex/http.hpp>
#include <nlohmann/json.hpp>

#include <arpa/inet.h>

#include <charconv>
#include <map>
#include <stdexcept>
#include <vector>

namespace lottiex {

using Json = nlohmann::json;

[[noreturn]] inline void invalid_field(const std::string& field) {
    throw std::runtime_error("Invalid configuration field: " + field);
}

inline void check_fields(const Json& value, const std::string& field,
                         std::initializer_list<std::string_view> allowed) {
    if (!value.is_object()) invalid_field(field);

    for (auto it = value.begin(); it != value.end(); ++it) {
        if (std::find(allowed.begin(), allowed.end(), it.key()) == allowed.end()) {
            invalid_field(field.empty() ? it.key() : field + "." + it.key());
        }
    }
}

template<class T>
T config_field(const Json& value, const char* key, const std::string& field) {
    if (!value.contains(key)) invalid_field(field);

    try {
        return value.at(key).get<T>();
    } catch (const Json::exception&) {
        invalid_field(field);
    }
}

inline unsigned config_number(const Json& value, const char* key, const std::string& field,
                              unsigned minimum, unsigned maximum, unsigned fallback) {
    if (!value.contains(key)) return fallback;

    const auto& number = value.at(key);
    if (!number.is_number_integer() || number < minimum || number > maximum) invalid_field(field);

    return number.get<unsigned>();
}

inline bool numeric_ip(const std::string& host) {
    in_addr ipv4{};
    in6_addr ipv6{};

    return host.find('\0') == std::string::npos &&
           (inet_pton(AF_INET, host.c_str(), &ipv4) == 1 ||
            inet_pton(AF_INET6, host.c_str(), &ipv6) == 1);
}

struct Upstream {
    std::string host;
    unsigned port = 80;
};

struct Route {
    std::string path;
    bool exact;
    std::string upstream;
    bool strip_prefix = false;
};

inline Upstream parse_upstream(std::string_view url, const std::string& field) {
    if (!url.starts_with("http://")) invalid_field(field);

    url.remove_prefix(7);
    if (url.ends_with('/')) url.remove_suffix(1);

    const bool ipv6 = url.starts_with('[');
    const auto end = ipv6 ? url.find(']') : url.find(':');
    if (ipv6 && end == std::string_view::npos) invalid_field(field);

    const auto host = ipv6 ? url.substr(1, end - 1) : url.substr(0, end);
    if (host.empty()) invalid_field(field);

    Upstream upstream{std::string(host)};
    if (ipv6) {
        if (host.find(':') == std::string_view::npos || !numeric_ip(upstream.host)) invalid_field(field);
    } else if (host.find_first_not_of("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.-") !=
               std::string_view::npos) {
        invalid_field(field);
    }

    const auto suffix = end == std::string_view::npos ? std::string_view{} : url.substr(end + ipv6);
    if (!suffix.empty()) {
        if (suffix.front() != ':') invalid_field(field);

        const auto last = suffix.data() + suffix.size();
        const auto parsed = std::from_chars(suffix.data() + 1, last, upstream.port);
        if (parsed.ec != std::errc{} || parsed.ptr != last ||
            upstream.port < 1 || upstream.port > 65535) invalid_field(field);
    }

    return upstream;
}

inline std::vector<Route> load_routes(const Json& json, const std::map<std::string, Upstream>& upstreams) {
    std::vector<Route> routes;
    if (!json.contains("routes")) return routes;

    const auto& entries = json.at("routes");
    if (!entries.is_array()) invalid_field("routes");

    for (std::size_t i = 0; i < entries.size(); ++i) {
        const auto& entry = entries[i];
        const auto field = "routes[" + std::to_string(i) + "]";
        check_fields(entry, field, {"path", "match", "action", "upstream", "strip_prefix"});

        const auto path = config_field<std::string>(entry, "path", field + ".path");
        const auto match = config_field<std::string>(entry, "match", field + ".match");
        const auto action = config_field<std::string>(entry, "action", field + ".action");

        if (match != "exact" && match != "prefix") invalid_field(field + ".match");
        if (action != "static" && action != "proxy") invalid_field(field + ".action");

        std::string decoded;
        if (!decode_path(path, decoded) || path.find_first_of("?# ") != std::string::npos ||
            (match == "prefix" && path.size() > 1 && path.ends_with('/'))) {
            invalid_field(field + ".path");
        }

        Route route{path, match == "exact", {}};

        if (action == "proxy") {
            route.upstream = config_field<std::string>(entry, "upstream", field + ".upstream");
            if (!upstreams.contains(route.upstream)) invalid_field(field + ".upstream");

            if (entry.contains("strip_prefix")) {
                route.strip_prefix = config_field<bool>(entry, "strip_prefix", field + ".strip_prefix");
                if (route.strip_prefix && (route.exact || path == "/")) invalid_field(field + ".strip_prefix");
            }
        } else if (entry.contains("upstream") || entry.contains("strip_prefix")) {
            invalid_field(field + (entry.contains("upstream") ? ".upstream" : ".strip_prefix"));
        }

        for (const auto& existing : routes) {
            if (existing.exact == route.exact && existing.path == path) invalid_field(field + ".path");
        }

        routes.push_back(std::move(route));
    }

    std::stable_sort(routes.begin(), routes.end(), [](const Route& a, const Route& b) {
        if (a.exact != b.exact) return a.exact;
        return a.path.size() > b.path.size();
    });

    return routes;
}

inline const Route* match_route(const std::vector<Route>& routes, std::string_view path) {
    for (const auto& route : routes) {
        if (path == route.path) return &route;
        if (!route.exact && (route.path == "/" ||
            (path.starts_with(route.path) && path[route.path.size()] == '/'))) {
            return &route;
        }
    }

    return nullptr;
}

}

#endif
