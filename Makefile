CXX ?= g++
MODE ?= release
CPPFLAGS += -Iincludes
CXXFLAGS += -std=c++20 -Wall -Wextra -Wpedantic -pthread

ifeq ($(MODE),debug)
	CXXFLAGS += -O0 -g
else
	CXXFLAGS += -O2 -DNDEBUG
endif

.PHONY: all release debug clean FORCE

all: release

release:
	$(MAKE) MODE=release build/lttx

debug:
	$(MAKE) MODE=debug build/lttx

build/lttx: build/$(MODE)/main.o FORCE
	$(CXX) $(CXXFLAGS) $< -o $@

build/$(MODE)/main.o: src/main.cpp
	@test -f includes/cpp-httplib/httplib.h -a -f includes/nlohmann/json.hpp || (echo 'Missing dependencies: run python3 scripts/vendor.py'; exit 1)
	mkdir -p $(@D)
	$(CXX) $(CPPFLAGS) $(CXXFLAGS) -MMD -MP -c $< -o $@

-include build/$(MODE)/main.d

clean:
	rm -rf build/release build/debug build/lttx

