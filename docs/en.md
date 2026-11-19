# LottieX — Documentation (English)

<div align="center">
  <img src="../public/logo.png" alt="LottieX" width="336">
  <p><strong>A reverse proxy and HTTP server for Linux, built with C++20.</strong></p>
  <p>LOTT-ee eks /ˈlɒti ɛks/</p>
  <p><a href="ru.md">Russian</a> • <strong>English</strong> • <a href="../README.md">README</a></p>
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
| curl | Downloading the installer and running the HTTP examples |

### Install with one command

On Linux x86_64, with `curl`, Bash, `tar` and `sha256sum`:

```bash
curl -fsSL https://thekeny.github.io/LottieX/install.sh | bash
```

Or from the project root:

```bash
./scripts/install.sh
lttx check
lttx run
```

The online installer downloads the latest GitHub Release on x86_64, checks its SHA-256 checksum and installs `lttx` in `~/.local/bin` without `sudo`. The binary is built on Debian 12 and requires a compatible glibc and libstdc++ at runtime. On other Linux architectures, the online installer downloads the source from `master` and builds it with GNU Make and a C++20 compiler. Installing from a local checkout uses the same build tools and works offline. If the install directory is missing from `PATH`, run the printed command in your current terminal and add it to your shell configuration.

Choose another prefix with `./scripts/install.sh --prefix /absolute/path` or the `PREFIX` environment variable. The executable goes into its `bin/` directory. Run the installer again to update. Remove the installed `bin/lttx` file to uninstall.

Use `lttx` from any directory. The `run` and `check` commands require a local `lottiex.json` or `--config /path/to/lottiex.json`. To try the demo, get `lottiex.json` and `public/` from the checkout or the [latest release archive](https://github.com/thekeny/LottieX/releases/latest).

With curl and a custom prefix:

```bash
curl -fsSL https://thekeny.github.io/LottieX/install.sh | bash -s -- --prefix "$HOME/.local"
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

Add optional `upstreams` and `routes` fields to connect applications. The config checker validates the schema without contacting the upstream services.

```json
{
  "server": { "host": "127.0.0.1", "port": 8080 },
  "static": { "enabled": true, "root": "./public", "index": "index.html" },
  "upstreams": { "backend": "http://api:8000" },
  "routes": [
    { "path": "/api", "match": "prefix", "action": "proxy", "upstream": "backend", "strip_prefix": true },
    { "path": "/", "match": "prefix", "action": "static" }
  ]
}
```

Upstream URLs use plain HTTP with a hostname, numeric address, or bracketed IPv6 address. The port defaults to 80. An upstream URL identifies an origin. Route rules handle paths. For example, `http://[::1]:8000` is a valid origin.

The first applicable rule is the exact URL path, followed by the longest segment prefix. Route paths use the spelling of the original percent-encoded path. A prefix other than `/` has no trailing slash. Requests without a match use the static handler. `strip_prefix` defaults to false. Setting it on a non-root proxy prefix changes `/api` to `/` and `/api/users` to `/users`. The original query string is preserved, including repeated parameters.

#### Server limits and timeouts

| Field in `server` | Default | Range or type |
| :--- | :--- | :--- |
| `workers` | 8 | 1–128 |
| `queue` | 64 | 1–4096 |
| `client_read_seconds` | 30 | 1–300 |
| `client_write_seconds` | 30 | 1–300 |
| `upstream_connect_seconds` | 3 | 1–60 |
| `upstream_read_seconds` | 30 | 1–300 |
| `upstream_write_seconds` | 30 | 1–300 |
| `drain_seconds` | 30 | 1–600 |
| `max_target_bytes` | 8192 | 1–8192 |
| `max_header_bytes` | 32768 | 128–65536 |
| `max_body_bytes` | 8388608 | 1–67108864 |
| `trusted_proxies` | `[]` | Array of numeric IPv4 or IPv6 addresses |

The upstream connect timeout applies after system DNS resolution. The upstream read and write limits apply to waits for data and writable sockets. SSE senders need to deliver data or heartbeat messages within the configured read timeout. On SIGTERM or SIGINT, connections already accepted may continue until the drain deadline. In-flight socket reads and writes are interrupted after that deadline for configurations with upstreams. Connections beyond the worker and queue limits are closed.

The header limit applies to the aggregate parsed name and value size, including four bytes of syntax overhead per field. cpp-httplib also caps header lines at 8 KiB and accepts at most 100 fields. Request bodies are buffered up to the configured limit per worker. Responses stream in blocks up to 64 KiB, including unknown-length responses. A stalled or truncated upstream closes the stream if response headers have already been sent.

#### Forwarded headers and status codes

LottieX forwards the original `Host` and sets `X-Forwarded-Host`, `X-Forwarded-For`, `X-Forwarded-Proto`, `X-Forwarded-Port` and `X-Request-Id`. A directly connected proxy listed in `trusted_proxies` may provide a single client IP and the `https` scheme. Configure only the address of the proxy that overwrites incoming forwarded headers. Applications can use these headers for redirects, logs and secure cookies.

Proxy routes support GET, HEAD, POST, PUT, PATCH, DELETE and OPTIONS. A fixed-length or chunked request body is sent upstream with a new content length. Headers tied to a single connection are removed. Backend redirects, statuses, separate cookies and response metadata such as `Vary` are forwarded. Point the static root at a dedicated directory of public assets. Hidden paths and the active LottieX configuration file return 404 when requested as static content.

| Status | Meaning |
| :--- | :--- |
| 400 | Invalid request or ambiguous framing |
| 413 | Request body exceeds the limit |
| 414 | Request target exceeds the limit |
| 431 | Parsed header bytes exceed the limit |
| 502 | Upstream connection failed or returned an invalid HTTP response |
| 504 | Upstream timeout before response headers |

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

The table shows defaults. Configure server limits in the [server limits and timeouts](#server-limits-and-timeouts) table. Files are sent through a content provider without loading the whole file into a response string. When the queue is full, the new connection is closed; an HTTP 503 response is not guaranteed.

A dedicated signal-wait thread handles SIGINT and SIGTERM. The server stops queuing new connections and drains accepted work, including queued connections and incomplete request headers. It then closes the listening socket. A configuration with upstreams applies the `server.drain_seconds` deadline to active sockets. A static-only configuration drains using the network timeouts.

Caddy handles public TLS. The [reverse proxy](#reverse-proxy) section describes forwarding, logs and response streaming.

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
| 502 or 504 | Check the service address or timeout in the [deployment guide](../examples/reverse-proxy/README.md#troubleshooting) |
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
