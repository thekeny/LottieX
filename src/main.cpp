#include <lottiex/LottieX.hpp>

#include <iostream>
#include <string>

void print_help() {
    std::cout << "LottieX " << lottiex::VERSION << "\nUsage: lttx <command>\n"
              << "  run [--config PATH]   Start HTTP server\n"
              << "  check [--config PATH] Validate configuration\n"
              << "  version               Show version\n"
              << "  help                  Show help\n";
}

int main(int argc, char* argv[]) {
    try {
        const std::string command = argc > 1 ? argv[1] : "help";
        if (command == "help" && argc <= 2) {
            print_help();
            return 0;
        }

        if (command == "version" && argc == 2) {
            std::cout << "LottieX " << lottiex::VERSION << '\n';
            return 0;
        }

        if (command != "run" && command != "check") {
            throw std::runtime_error("Unknown command; use lttx help");
        }

        std::string path = "lottiex.json";
        if (argc == 4 && std::string(argv[2]) == "--config") {
            path = argv[3];
        } else if (argc != 2) {
            throw std::runtime_error("Expected: lttx " + command + " [--config PATH]");
        }

        auto config = lottiex::load_config(path);
        if (command == "check") {
            std::cout << "Configuration OK\n";
            return 0;
        }

        lottiex::Server(std::move(config)).run();
    } catch (const std::exception& error) {
        std::cerr << "lttx: " << error.what() << '\n';
        return 1;
    }
}
