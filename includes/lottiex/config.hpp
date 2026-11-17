#ifndef LOTTIEX_CONFIG_HPP
#define LOTTIEX_CONFIG_HPP

#pragma once

#include <lottiex/routes.hpp>

#include <filesystem>
#include <fstream>
#include <stdexcept>
#include <string>

namespace lottiex {

struct ServerConfig {
    std::string host;
    unsigned short port;
    bool static_enabled;
    std::filesystem::path root;
    std::filesystem::path source;
    std::string index;
    std::map<std::string, Upstream> upstreams;
    std::vector<Route> routes;
    std::vector<std::string> trusted_proxies;
    unsigned workers;
    unsigned queue;
    unsigned client_read_seconds;
    unsigned client_write_seconds;
    unsigned upstream_connect_seconds;
    unsigned upstream_read_seconds;
    unsigned upstream_write_seconds;
    unsigned drain_seconds;
    unsigned max_target_bytes;
    unsigned max_header_bytes;
    unsigned max_body_bytes;
};

inline ServerConfig load_config(const std::filesystem::path& path) {
    std::ifstream input(path);
    if (!input) {
        throw std::runtime_error("Cannot open configuration: " + path.string());
    }

    const auto json = Json::parse(input);
    check_fields(json, "", {"server", "static", "upstreams", "routes"});
    const auto server = config_field<Json>(json, "server", "server");
    const auto files = config_field<Json>(json, "static", "static");
    check_fields(server, "server", {
        "host", "port", "workers", "queue", "client_read_seconds", "client_write_seconds",
        "upstream_connect_seconds", "upstream_read_seconds", "upstream_write_seconds",
        "drain_seconds", "max_target_bytes", "max_header_bytes", "max_body_bytes", "trusted_proxies"
    });
    check_fields(files, "static", {"enabled", "root", "index"});

    ServerConfig config{};
    config.host = config_field<std::string>(server, "host", "server.host");
    if (!numeric_ip(config.host)) invalid_field("server.host");

    const auto port = config_number(server, "port", "server.port", 1, 65535, 0);
    if (!port) invalid_field("server.port");

    config.port = static_cast<unsigned short>(port);
    config.static_enabled = config_field<bool>(files, "enabled", "static.enabled");
    config.root = config_field<std::string>(files, "root", "static.root");
    config.index = config_field<std::string>(files, "index", "static.index");

    const std::filesystem::path index(config.index);
    if (index.empty() || index.is_absolute() || config.index.find('\0') != std::string::npos) {
        invalid_field("static.index");
    }

    for (const auto& part : index) {
        if (part == "..") {
            invalid_field("static.index");
        }
    }

    if (config.root.empty() || config.root.native().find('\0') != std::string::npos) {
        invalid_field("static.root");
    }

    if (config.root.is_relative()) {
        config.root = std::filesystem::absolute(path).parent_path() / config.root;
    }

    if (config.static_enabled) {
        std::error_code error;
        config.root = std::filesystem::canonical(config.root, error);
        if (error || !std::filesystem::is_directory(config.root, error)) invalid_field("static.root");
    }

    if (json.contains("upstreams")) {
        const auto& entries = json.at("upstreams");
        if (!entries.is_object()) invalid_field("upstreams");

        for (auto it = entries.begin(); it != entries.end(); ++it) {
            const auto field = "upstreams." + it.key();
            if (it.key().empty() || it.key().find_first_not_of(
                "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_-") != std::string::npos) {
                invalid_field("upstreams");
            }

            if (!it.value().is_string()) invalid_field(field);
            config.upstreams.emplace(it.key(), parse_upstream(it.value().get<std::string>(), field));
        }
    }

    config.source = std::filesystem::weakly_canonical(path);
    config.routes = load_routes(json, config.upstreams);
    config.workers = config_number(server, "workers", "server.workers", 1, 128, 8);
    config.queue = config_number(server, "queue", "server.queue", 1, 4096, 64);
    config.client_read_seconds = config_number(server, "client_read_seconds", "server.client_read_seconds", 1, 300, 30);
    config.client_write_seconds = config_number(server, "client_write_seconds", "server.client_write_seconds", 1, 300, 30);
    config.upstream_connect_seconds = config_number(server, "upstream_connect_seconds", "server.upstream_connect_seconds", 1, 60, 3);
    config.upstream_read_seconds = config_number(server, "upstream_read_seconds", "server.upstream_read_seconds", 1, 300, 30);
    config.upstream_write_seconds = config_number(server, "upstream_write_seconds", "server.upstream_write_seconds", 1, 300, 30);
    config.drain_seconds = config_number(server, "drain_seconds", "server.drain_seconds", 1, 600, 30);
    config.max_target_bytes = config_number(server, "max_target_bytes", "server.max_target_bytes", 1, 8192, 8192);
    config.max_header_bytes = config_number(server, "max_header_bytes", "server.max_header_bytes", 128, 65536, 32768);
    config.max_body_bytes = config_number(server, "max_body_bytes", "server.max_body_bytes", 1, 64 * 1024 * 1024, 8 * 1024 * 1024);

    if (server.contains("trusted_proxies")) {
        config.trusted_proxies = config_field<std::vector<std::string>>(server, "trusted_proxies", "server.trusted_proxies");
        for (const auto& proxy : config.trusted_proxies) {
            if (!numeric_ip(proxy)) invalid_field("server.trusted_proxies");
        }
    }

    return config;
}

}

#endif
