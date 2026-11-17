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
    std::string index;
    std::map<std::string, Upstream> upstreams;
    std::vector<Route> routes;
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
    check_fields(server, "server", {"host", "port"});
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

    config.routes = load_routes(json, config.upstreams);
    return config;
}

}

#endif
