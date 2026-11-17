#ifndef LOTTIEX_CONFIG_HPP
#define LOTTIEX_CONFIG_HPP

#pragma once

#include <arpa/inet.h>
#include <cstdint>
#include <nlohmann/json.hpp>

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
};

inline ServerConfig load_config(const std::filesystem::path& path) {
    std::ifstream input(path);
    if (!input) {
        throw std::runtime_error("Cannot open configuration: " + path.string());
    }

    const auto json = nlohmann::json::parse(input);
    const auto& server = json.at("server");
    const auto& files = json.at("static");
    if (!server.at("host").is_string() || !server.at("port").is_number_integer() ||
        !files.at("enabled").is_boolean() || !files.at("root").is_string() ||
        !files.at("index").is_string()) {
        throw std::runtime_error("Invalid configuration field types");
    }

    const auto port = server.at("port").get<std::int64_t>();
    if (port < 1 || port > 65535) {
        throw std::runtime_error("Port must be in 1..65535");
    }

    ServerConfig config{
        server.at("host").get<std::string>(),
        static_cast<unsigned short>(port),
        files.at("enabled").get<bool>(),
        files.at("root").get<std::string>(),
        files.at("index").get<std::string>()
    };

    in_addr ipv4{};
    in6_addr ipv6{};
    if (config.host.find('\0') != std::string::npos ||
        (inet_pton(AF_INET, config.host.c_str(), &ipv4) != 1 &&
         inet_pton(AF_INET6, config.host.c_str(), &ipv6) != 1)) {
        throw std::runtime_error("Host must be a numeric IP address");
    }

    const std::filesystem::path index(config.index);
    if (index.empty() || index.is_absolute()) {
        throw std::runtime_error("Invalid index path");
    }

    for (const auto& part : index) {
        if (part == "..") {
            throw std::runtime_error("Invalid index path");
        }
    }

    if (config.root.empty()) {
        throw std::runtime_error("Static root must not be empty");
    }

    if (config.root.is_relative()) {
        config.root = std::filesystem::absolute(path).parent_path() / config.root;
    }

    if (config.static_enabled) {
        config.root = std::filesystem::canonical(config.root);
        if (!std::filesystem::is_directory(config.root)) {
            throw std::runtime_error("Static root is not a directory");
        }
    }

    return config;
}

}

#endif
