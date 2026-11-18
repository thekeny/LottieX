# LottieX — Documentation (English)

<div align="center">
  <img src="../public/logo.png" alt="LottieX" width="336">
  <p><strong>A C++20 HTTP server and reverse proxy for Linux, hackathons and small demos.</strong></p>
  <p><a href="ru.md">Русский</a> • <strong>English</strong> • <a href="../README.md">README</a></p>
</div>

---

## Contents

1. [Overview](#1-overview)
2. [Build and run](#2-build-and-run)
3. [CLI reference](#3-cli-reference)
4. [Configuration](#4-configuration)
5. [Static files and HTTP](#5-static-files-and-http)
6. [Architecture and limits](#6-architecture-and-limits)
7. [Verification and troubleshooting](#7-verification-and-troubleshooting)
8. [Project layout and license](#8-project-layout-and-license)

---

## 1. Overview

For a runnable Next.js, FastAPI and PostgreSQL example, start the `examples/fullstack` stack with `./examples/fullstack/demo up`. [Fullstack demo instructions](../examples/fullstack/README.md)

**LottieX 0.1.0** serves files and routes requests to your applications over HTTP/1.1. See the [VM and Compose deployment examples](../examples/reverse-proxy/README.md) for HTTP and public HTTPS.

Features include GET and HEAD, directory indexes, MIME types, IPv4/IPv6, JSON configuration validation, file streaming and draining accepted work on shutdown.

The project uses GNU Make, [cpp-httplib](https://github.com/yhirose/cpp-httplib) and [nlohmann/json](https://github.com/nlohmann/json). Dependencies are bundled under `includes/`; normal builds require no internet access or separate library downloads.

## 2. Build and run

### Requirements

| Tool | Purpose |
| :--- | :--- |
| Linux | Sockets, POSIX signals and threads |
| C++20 compiler and standard library | Building; the code uses `std::jthread`, `std::stop_token` and `std::osyncstream` |
| GNU Make | Build management |
| Python 3 | Only for tests |
| curl | Only for the HTTP examples below |

### Install with one command

Without Git (requires curl and tar):

```bash
curl -fsSL https://raw.githubusercontent.com/thekeny/LottieX/master/install.sh | bash
```

Or from the project root:

```bash
./install.sh
lttx check
lttx run
```

The script builds release mode and installs `lttx` in `~/.local/bin`, without `sudo`. When piped from curl or run outside a checkout, it downloads the source archive from GitHub into a temporary directory and removes it on exit. Local installation works offline. GNU Make and a C++20 compiler must already be installed. If the directory is missing from `PATH`, run the printed command in your current terminal and add it to your shell configuration.

Choose another prefix with `./install.sh --prefix /absolute/path` or the `PREFIX` environment variable. The executable goes into its `bin/` directory. Run the installer again to update; remove the installed `bin/lttx` file to uninstall.

Use `lttx` from any directory. The `run` and `check` commands require a local `lottiex.json` or `--config /path/to/lottiex.json`. The installer does not copy configuration or site files.

With curl and a custom prefix:

```bash
curl -fsSL https://raw.githubusercontent.com/thekeny/LottieX/master/install.sh | bash -s -- --prefix "$HOME/.local"
```

### Build without installation

```bash
make release
./build/lttx check
./build/lttx run
```

Open [http://127.0.0.1:8080](http://127.0.0.1:8080). You should see **LottieX is running.** from `public/index.html`. The supplied configuration listens on all IPv4 interfaces (`0.0.0.0:8080`).

Stop with **Ctrl+C** or by sending SIGTERM to the server process.

### Build modes

```bash
make release          # -O2 -DNDEBUG
make debug            # -O0 -g
make release CXX=g++  # select the compiler explicitly
make clean            # remove object files and build/lttx
```

Running `make` without a target builds release mode. Object files live in `build/release/` and `build/debug/`, but both modes write the same executable: `build/lttx`. The last build determines its mode.

## 3. CLI reference

```text
lttx run [--config PATH]
lttx check [--config PATH]
lttx version
lttx help
```

| Command | Behavior |
| :--- | :--- |
| `run` | Load configuration, bind the socket and start the server |
| `check` | Read JSON, validate fields and the static root; print `Configuration OK` |
| `version` | Print `LottieX 0.1.0` |
| `help` | Print usage; also shown when invoked without arguments |

`--config PATH` is available only for `run` and `check`. Without it, the CLI looks for `lottiex.json` in the current working directory. A relative `PATH` is also resolved from the working directory.

```bash
lttx check --config /srv/demo/lottiex.json
lttx run --config /srv/demo/lottiex.json
```

Successful CLI completion returns exit code `0`; an error returns `1` and writes `lttx: ...` to stderr. `check` does not open a listening socket or verify that the port is available.

## 4. Configuration

The supplied [`lottiex.json`](../lottiex.json):

```json
{
  "server": {
    "host": "0.0.0.0",
    "port": 8080
  },
  "static": {
    "enabled": true,
    "root": "./public",
    "index": "index.html"
  }
}
```

All listed fields are required. The table shows example values, not defaults inserted for missing fields. Use standard JSON without comments or trailing commas.

| Field | Type | Example | Rules |
| :--- | :--- | :--- | :--- |
| `server.host` | string | `"0.0.0.0"` | Numeric IPv4/IPv6 address; hostnames are rejected |
| `server.port` | integer | `8080` | From `1` to `65535` |
| `static.enabled` | boolean | `true` | Enable or disable file serving |
| `static.root` | string | `"./public"` | Nonempty path; must exist and be a directory when serving is enabled |
| `static.index` | string | `"index.html"` | Nonempty relative path without `..` components |

### Reverse proxy

Add optional `upstreams` and `routes` fields to connect applications. The config checker validates the schema without contacting the upstream services. See the [proxy settings and routing rules](proxy.md).

### Listening address

| Address | Meaning |
| :--- | :--- |
| `127.0.0.1` | IPv4 loopback only |
| `0.0.0.0` | All IPv4 interfaces |
| `::1` | IPv6 loopback; use `http://[::1]:8080/` in a browser |
| `::` | IPv6 wildcard; IPv4 availability depends on OS settings |

`localhost` is not accepted as `server.host`. Write IPv6 without brackets in JSON: `"host": "::1"`.

### Relative paths

`static.root` is resolved against the **configuration file's directory**. With a configuration at `/srv/demo/lottiex.json`, `"root": "./public"` refers to `/srv/demo/public`, regardless of the process working directory.

With `static.enabled: false`, the directory does not need to exist, but all other fields and their formats are still required. GET and HEAD on static routes return 404.

Restart the server to apply configuration changes. The `check` command does not verify individual files or the existence of an index page.

## 5. Static files and HTTP

### URL-to-file mapping

With `public/` as the root and `index.html` as the index:

| URL | File or result |
| :--- | :--- |
| `/` | `public/index.html` |
| `/styles.css` | `public/styles.css` |
| `/images/logo.png` | `public/images/logo.png` |
| `/guide/` | `public/guide/index.html` |
| `/guide` | The same directory index, if `guide` is a directory |
| `/styles.css?v=1` | `public/styles.css`; the query string does not affect file lookup |
| `/missing` | 404 if no such file or directory exists |

The index is appended only when the resolved path is a directory. There is no directory listing or SPA fallback to the root `index.html`.

The path is decoded from the original URL exactly once. For example, `/%252e%252e/file.txt` addresses a literal `%2e%2e` directory, while `/%2e%2e/file.txt` contains `..` and receives 404. Symlinks are allowed as long as the final canonical path stays inside the static root; containment is checked again after appending the index.

### Methods and responses

| Situation | Response |
| :--- | :--- |
| GET an existing file | `200`, file contents |
| HEAD an existing file | `200`, the same `Content-Length` as GET, without a body |
| Missing file or index, serving disabled, path outside the root | `404` |
| Other recognized methods: POST, PUT, DELETE, OPTIONS, PATCH, TRACE | `405`, `Allow: GET, HEAD` |
| Invalid path or unsuitable request format | `400` |
| Failure opening an existing file or a filesystem error | `500` |

The server expects HTTP/1.1 with exactly one nonempty `Host` header. Static routes reject requests with `Transfer-Encoding` or a `Content-Length` other than `0`. Paths with hidden components such as `.env` return 404. Request format validation precedes method validation, so an invalid request can receive 400 instead of 405.

Responses include `Server: LottieX` and `Connection: close`. The connection closes after each response.

### MIME types

Extension matching is case-insensitive.

| Extension | Content-Type |
| :--- | :--- |
| `.html`, `.htm` | `text/html; charset=utf-8` |
| `.css` | `text/css; charset=utf-8` |
| `.js` | `text/javascript; charset=utf-8` |
| `.json` | `application/json` |
| `.png` | `image/png` |
| `.jpg`, `.jpeg` | `image/jpeg` |
| `.svg` | `image/svg+xml` |
| `.txt` | `text/plain; charset=utf-8` |
| `.ico` | `image/x-icon` |
| Other extensions | `application/octet-stream` |

### Request examples

With the server running, use another terminal:

```bash
curl -i http://127.0.0.1:8080/
curl -I http://127.0.0.1:8080/
curl -i http://127.0.0.1:8080/missing
curl -i -X POST http://127.0.0.1:8080/
curl --path-as-is -i http://127.0.0.1:8080/../outside.txt
```

Expected statuses: `200`, `200`, `404`, `405`, `404`.

## 6. Architecture and limits

Request flow: **cpp-httplib → connection queue → HTTP and path validation → route → file or upstream → content provider → response**.

| Parameter | Value |
| :--- | :--- |
| Networking | cpp-httplib, blocking I/O |
| Worker threads | 8 |
| Maximum waiting connections in the queue | 64 |
| File read block | Up to 64 KiB |
| Read / write timeout | 30 seconds each |
| Requests per connection | 1 |

The table shows defaults. Configure server limits as described in the [proxy reference](proxy.md). Files are sent through a content provider without loading the whole file into a response string. When the queue is full, the new connection is closed; an HTTP 503 response is not guaranteed.

A dedicated signal-wait thread handles SIGINT and SIGTERM. The server stops queuing new connections and drains accepted work, including queued connections and incomplete request headers. It then closes the listening socket. A configuration with upstreams applies the `server.drain_seconds` deadline to active sockets. A static-only configuration drains using the network timeouts.

Caddy handles public TLS. The [proxy reference](proxy.md) describes forwarding, logs and response streaming.

## 7. Verification and troubleshooting

### Smoke tests

```bash
make release
python3 tests/smoke.py
python3 tests/proxy.py
make debug
python3 tests/smoke.py
python3 tests/proxy.py
make release
```

Tests start real local servers and create temporary files and symlinks. They cover the CLI, configuration, GET/HEAD, MIME types, large and empty files, indexes, paths, concurrent requests, occupied ports and shutdown. The IPv6 check is skipped only when IPv6 loopback is unavailable. The final command leaves a release executable at `build/lttx`.

### Common problems

| Message or symptom | What to check |
| :--- | :--- |
| `Cannot open configuration` | The path after `--config`; otherwise, `lottiex.json` in the working directory |
| `Invalid configuration field: ...` | Check the named field against the configuration reference |
| 502 or 504 | Check the service address or timeout in the [deployment guide](../examples/reverse-proxy/README.md#диагностика) |
| `Cannot listen on ...` | The address is assigned locally, the port is available, and the process can bind it |
| 404 for `/` | Serving is enabled and `static.root` contains the `static.index` file |
| 404 for an existing file | The root is relative to the configuration, the path and case are correct, and any symlink stays inside the root |
| Build fails due to missing dependencies | Restore `includes/cpp-httplib/` and `includes/nlohmann/` from a complete project copy |

There is no `scripts/vendor.py` in this repository; it is not required to build. Missing fields and JSON syntax errors may produce messages directly from nlohmann/json.

On startup, the server prints its version and address. Access logs include UTC time, request ID, method, path without the query string, status, elapsed microseconds, response body bytes and upstream. Upstream errors go to stderr with the same request ID.

## 8. Project layout and license

```text
LottieX/
├── Makefile
├── lottiex.json
├── src/main.cpp                 # lttx commands
├── includes/
│   ├── lottiex/
│   │   ├── LottieX.hpp           # umbrella header
│   │   ├── config.hpp           # JSON loading and validation
│   │   ├── http.hpp             # version, URL decoding, MIME
│   │   └── server.hpp           # routing, queue and shutdown
│   ├── cpp-httplib/             # library and license
│   └── nlohmann/                # library and license
├── public/                      # static files and logo
├── docs/                        # ru.md and en.md
└── tests/                       # static and proxy integration checks
```

Include application headers with `<lottiex/LottieX.hpp>` and the `-Iincludes` search path. Filename case matters on Linux.

LottieX uses the [MIT license](../LICENSE). Dependency licenses: [cpp-httplib](../includes/cpp-httplib/LICENSE), [nlohmann/json](../includes/nlohmann/LICENSE).
