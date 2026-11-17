# Reverse proxy configuration

`lttx check` validates the config and any enabled static root. Upstream DNS and connectivity are checked when serving a request. Restart LottieX after editing the file.

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

## Optional server settings

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

## Forwarded headers and status codes

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

[VM and Docker Compose deployment guide](../examples/reverse-proxy/README.md)
