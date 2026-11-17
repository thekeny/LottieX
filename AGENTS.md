# LottieX agent notes

## Formatting preferences

- Use four spaces for C++ indentation and opening braces on the same line.
- Separate logical steps with a single blank line: validation, path resolution, file setup, response setup, and callback registration should not run together visually. Keep related statements grouped; do not put a blank line after every statement.
- Keep `includes/lottiex/server.hpp` free of explanatory comments, as requested by the owner. Preserve non-obvious implementation rationale in this file instead.
- Short guard clauses and trivial methods may stay on one line. Do not expand them or reformat unrelated files just for consistency.
- Keep Makefile recipe indentation as tabs.
- Keep Python tests readable too: use four-space indentation, separate setup, requests, assertions, and cleanup with a single blank line, and wrap long calls and data structures. Group related checks; do not put a blank line after every statement.

## Project boundaries and layout

- This is a small Linux C++20 HTTP server and reverse proxy for hackathons. Keep GNU Make, the `lttx` CLI, and `lottiex.json`; do not introduce another build system or framework without a request.
- Application headers live in `includes/lottiex/`, not `include/`. The umbrella header is exactly `lottiex/LottieX.hpp`; case matters on Linux.
- Networking uses cpp-httplib, not Asio. Keep the upstream header and its license together under `includes/cpp-httplib/`, and include it as `<cpp-httplib/httplib.h>`. Keep vendored upstream code unmodified when changing application behavior.
- nlohmann/json is also vendored. Normal builds must work offline. Do not assume a dependency download script exists: README and Makefile currently mention `scripts/vendor.py`, but that file is absent. Do not recreate it as an unrelated change.
- Do not add REST endpoints, HTTPS, SPA fallback, caching, proxying, or daemon features unless requested.

## Image assets

- Preserve the owner's original logo and icon. A request to improve quality or resolution means enlarging the existing artwork, not generating, redrawing, or redesigning it.
- For pixel art, use integer nearest-neighbor scaling without smoothing. Preserve every source pixel, colors, proportions, and alpha transparency; do not invent details.
- Verify that every enlarged pixel block matches the original RGBA value. Keep the original source recoverable.

## Behavior that is easy to break

- A relative static root is resolved against the configuration file's directory, not the process working directory. Listen addresses must be numeric IPv4/IPv6 addresses; `localhost` is intentionally rejected by configuration validation.
- Serve static files with GET and HEAD. HEAD sends the same content length as GET without the body. Missing files, disabled static serving, traversal attempts, and symlinks escaping the static root return 404. Other supported HTTP methods on static routes return 405 with `Allow: GET, HEAD`.
- Resolve directory indexes using `static.index`. Do not replace this with cpp-httplib's default mount behavior or a root index fallback for missing files.
- Decode the path from `request.target` exactly once, excluding the query string. cpp-httplib's `request.path` is already decoded; decoding it again changes literal percent-encoded filenames and can undermine path checks.
- Check containment by canonical path components, including after appending the index. A string-prefix check does not establish containment. Preserve checks against symlinks escaping the root.
- Stream files through a content provider in blocks up to 64 KiB. Do not load entire files into response strings. Close the connection after each response.
- Set `SO_REUSEADDR` explicitly. cpp-httplib's default can use `SO_REUSEPORT`, allowing a second server to bind the same address and port instead of reporting an error.
- Do not call cpp-httplib's `stop()` immediately on SIGINT/SIGTERM: it can truncate active content-provider responses. The queue first rejects new work and drains accepted connections, then closes the listener when the pending count reaches zero. Pending work includes queued connections and incomplete request headers, not just running route handlers.
- Block termination signals before creating worker threads and consume them in the signal-wait thread. Do not invoke server operations from an asynchronous signal handler.
- The default capacity is 8 workers with 64 queued connections and 30-second read/write timeouts. Static-only shutdown uses the network timeouts. A proxy configuration also starts a drain timer on termination and interrupts registered sockets when it expires.
- The listener adapter uses cpp-httplib's stream to read proxy request bodies before ordinary content handling can parse multipart or decode content. Clear the library's parsed byte ranges for proxy routes so it does not apply a client's range twice to an upstream 206.
- Upstream routing uses the raw escaped path and preserves the original query. Keep the body bounded and regenerate HTTP framing after removing hop-by-hop headers. A provider returns a failure on truncation so the downstream response cannot be mistaken for a complete stream.

## Verification

- For networking or configuration changes, run `make release`, `python3 tests/smoke.py`, then `make debug` and the smoke test again. Run `python3 tests/proxy.py` after the smoke test in both modes.
- Both build modes write `build/lttx`, with separate object directories. Run `make release` last if leaving a release executable for the owner.
- The smoke test launches real local servers and uses temporary files and symlinks. Its IPv6 listener check is skipped only when IPv6 loopback is unavailable.
- Pure spacing or comment edits do not need another full build/test cycle; verify that code tokens are unchanged.
