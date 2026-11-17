"""Run against a built binary: python3 tests/proxy.py."""

from contextlib import closing, contextmanager
import http.client
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
from pathlib import Path
import signal
import socket
import tempfile
import threading

from common import cli
from smoke import receive, running


class Upstream(BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def log_message(self, *_):
        pass

    def reply(self, status, body, headers=()):
        self.send_response(status)
        self.send_header("Content-Length", str(len(body)))

        for name, value in headers:
            self.send_header(name, value)

        self.end_headers()
        if self.command != "HEAD":
            self.wfile.write(body)

    def route(self):
        if self.path == "/slow":
            self.server.release.wait(8)
            return

        if self.path == "/broken":
            self.send_response(200)
            self.send_header("Content-Length", "20")
            self.end_headers()
            self.wfile.write(b"short")
            self.close_connection = True
            return

        if self.path == "/invalid":
            self.wfile.write(b"what is this\r\n")
            self.close_connection = True
            return

        if self.path == "/bad-framing":
            self.send_response(200)
            self.send_header("Content-Length", "5")
            self.send_header("Transfer-Encoding", "chunked")
            self.end_headers()
            self.close_connection = True
            return

        if self.path in ("/events", "/drain", "/cancel"):
            self.send_response(200)
            self.send_header("Content-Type", "text/event-stream")
            self.send_header("Transfer-Encoding", "chunked")
            self.end_headers()
            self.wfile.write(b"B\r\ndata: one\n\n\r\n")
            if self.path == "/cancel":
                self.connection.settimeout(4)
                if not self.rfile.read(1):
                    self.server.cancelled.set()
                self.close_connection = True
                return

            self.server.release.wait(8)
            try:
                self.wfile.write(b"B\r\ndata: two\n\n\r\n0\r\n\r\n")
            except OSError:
                pass
            return

        if self.path == "/cookies":
            self.reply(302, b"redirect", (
                ("Location", "/api"),
                ("Set-Cookie", "first=1; Path=/"),
                ("Set-Cookie", "second=2; Path=/"),
                ("Connection", "close, X-Internal"),
                ("X-Internal", "hidden"),
                ("Vary", "RSC, Next-Router-State-Tree"),
                ("Cache-Control", "no-store")
            ))
            return

        if self.path == "/error":
            self.reply(418, b"upstream error")
            return

        if self.path == "/range":
            self.reply(206, b"456", (("Content-Range", "bytes 4-6/10"),))
            return

        count = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(count)
        payload = json.dumps({
            "upstream": self.server.label,
            "method": self.command,
            "target": self.path,
            "body": body.hex(),
            "headers": dict(self.headers.items())
        }).encode()
        self.reply(200, payload, (("Content-Type", "application/json"),))

    do_GET = do_HEAD = do_POST = do_PUT = do_PATCH = do_DELETE = do_OPTIONS = route


@contextmanager
def upstream(label, port=0):
    with ThreadingHTTPServer(("127.0.0.1", port), Upstream) as server:
        server.label = label
        server.release = threading.Event()
        server.cancelled = threading.Event()
        thread = threading.Thread(target=server.serve_forever)
        thread.start()
        try:
            yield server
        finally:
            server.release.set()
            server.shutdown()
            thread.join()


def free_port():
    with socket.socket() as probe:
        probe.bind(("127.0.0.1", 0))
        return probe.getsockname()[1]


def request(port, path, method="GET", body=None, headers=None):
    with closing(http.client.HTTPConnection("127.0.0.1", port, timeout=5)) as client:
        client.request(method, path, body=body, headers=headers or {})
        response = client.getresponse()
        return response.status, response.headers, response.read()


def raw_request(port, data):
    with socket.create_connection(("127.0.0.1", port), timeout=4) as client:
        client.sendall(data)
        return receive(client)


def test_config(config, settings):
    for field, value, message in (
        ("upstreams", {"api": "https://backend:8000"}, "upstreams.api"),
        ("upstreams", {"api": "http://backend:65536"}, "upstreams.api"),
        ("upstreams", {"api": "http://user@backend"}, "upstreams.api"),
        ("upstreams", {"api": "http://backend/path"}, "upstreams.api"),
        ("upstreams", {"api": "http://[::1]:9000"}, "routes[2].upstream"),
        ("routes", settings["routes"] + [settings["routes"][0]], "routes[4].path"),
        ("unknown", True, "unknown")
    ):
        config.write_text(json.dumps({**settings, field: value}))
        result = cli("check", "--config", config, success=False)
        assert message in result.stderr, result.stderr

    config.write_text(json.dumps(settings))
    cli("check", "--config", config)


def test_requests(port):
    for path, expected in (
        ("/api?x=1&x=%2f&empty=", ("api", "/?x=1&x=%2f&empty=")),
        ("/api/a%20b/%252F", ("api", "/a%20b/%252F")),
        ("/api/status", ("frontend", "/api/status")),
        ("/apix", ("frontend", "/apix")),
        ("/_next/static/main.js", ("frontend", "/_next/static/main.js"))
    ):
        status, _, body = request(port, path)
        payload = json.loads(body)
        assert status == 200
        assert (payload["upstream"], payload["target"]) == expected

    assert request(port, "/asset.txt")[2] == b"asset"
    status, headers, _ = request(port, "/asset.txt", "POST")
    assert status == 405 and headers["Allow"] == "GET, HEAD"

    payloads = (
        ("POST", "application/json", b'{"item":"hello"}'),
        ("PUT", "application/x-www-form-urlencoded", b"a=1&a=2"),
        ("PATCH", "application/octet-stream", bytes(range(256))),
        ("DELETE", "multipart/form-data; boundary=demo",
         b'--demo\r\nContent-Disposition: form-data; name="file"\r\n\r\n\x00\r\n--demo--\r\n'),
        ("OPTIONS", "application/octet-stream", b"optional")
    )

    for method, content_type, data in payloads:
        status, _, body = request(port, "/api/echo", method, data, {"Content-Type": content_type})
        assert status == 200
        payload = json.loads(body)
        assert payload["method"] == method
        assert payload["headers"]["Content-Type"] == content_type
        assert bytes.fromhex(payload["body"]) == data

    status, headers, body = request(port, "/api/cookies")
    assert status == 302 and body == b"redirect" and headers["Location"] == "/api"
    assert headers.get_all("Set-Cookie") == ["first=1; Path=/", "second=2; Path=/"]
    assert headers["Vary"] == "RSC, Next-Router-State-Tree" and headers["Cache-Control"] == "no-store"
    assert headers["X-Internal"] is None

    assert request(port, "/api/error")[2] == b"upstream error"
    status, headers, body = request(port, "/api/error", "HEAD")
    assert status == 418 and headers["Content-Length"] == "14" and not body

    status, headers, body = request(port, "/api/range", headers={"Range": "bytes=4-6"})
    assert status == 206 and headers["Content-Range"] == "bytes 4-6/10" and body == b"456"

    status, response_headers, body = request(port, "/api/echo", headers={
        "Host": "demo.example:123",
        "Connection": "close, X-Remove",
        "X-Remove": "ignored",
        "X-Forwarded-Proto": "https",
        "X-Forwarded-For": "192.0.2.2",
        "Forwarded": "for=192.0.2.2",
        "X-Request-Id": "client-id"
    })
    assert status == 200
    headers = {name.lower(): value for name, value in json.loads(body)["headers"].items()}
    assert headers["host"] == headers["x-forwarded-host"] == "demo.example:123"
    assert headers["x-forwarded-proto"] == "http" and headers["x-forwarded-for"] == "127.0.0.1"
    assert headers["x-forwarded-port"] == "123"
    assert "x-remove" not in headers and "forwarded" not in headers
    assert headers["x-request-id"] == response_headers["X-Request-Id"] != "client-id"

    base = b"POST /api/echo HTTP/1.1\r\nHost: localhost\r\n"
    status, _, body = raw_request(
        port, base + b"Transfer-Encoding: chunked\r\n\r\n3\r\na\x00b\r\n0\r\n\r\n"
    )
    assert status == 200 and json.loads(body)["body"] == "610062"

    for headers, status in (
        (b"Content-Length: 0\r\nTransfer-Encoding: chunked\r\n", 400),
        (b"Content-Length: 1\r\nContent-Length: 2\r\n", 400),
        (b"Content-Length: 1\r\nContent-Length: 1\r\n", 400),
        (b"Content-Length: 4097\r\n", 413),
        (b"X-Long: " + b"a" * 1030 + b"\r\n", 431)
    ):
        assert raw_request(port, base + headers + b"\r\n")[0] == status

    assert request(port, "/api/" + "a" * 150)[0] == 414
    assert request(port, "/api/echo", "POST", b"x" * 4097)[0] == 413

    status, _, _ = raw_request(
        port, base + b"Transfer-Encoding: chunked\r\n\r\n1001\r\n" + b"a" * 4097 + b"\r\n0\r\n\r\n"
    )
    assert status == 413

    with socket.create_connection(("127.0.0.1", port), timeout=4) as client:
        client.sendall(base + b"Content-Length: 3\r\nExpect: 100-continue\r\n\r\n")
        with client.makefile("rb") as reply:
            assert reply.readline() == b"HTTP/1.1 100 Continue\r\n"
            assert reply.readline() == b"\r\n"
        client.sendall(b"abc")
        status, _, body = receive(client)
        assert status == 200 and json.loads(body)["body"] == "616263"


def open_events(port, path):
    client = http.client.HTTPConnection("127.0.0.1", port, timeout=3)
    try:
        client.request("GET", path)
        response = client.getresponse()
        assert response.status == 200
        assert response.read(11) == b"data: one\n\n"
        return client, response
    except BaseException:
        client.close()
        raise


def test_streams(port, api, process):
    assert request(port, "/api/slow")[0] == 504
    assert request(port, "/api/invalid")[0] == 502
    assert request(port, "/api/bad-framing")[0] == 502

    client, response = open_events(port, "/api/cancel")
    response.close()
    client.close()
    assert api.cancelled.wait(1.5), "Upstream connection stayed open after a client disconnected"

    try:
        request(port, "/api/broken")
    except http.client.IncompleteRead as error:
        assert error.partial == b"short"
    else:
        raise AssertionError("Proxy accepted a truncated response")

    streams = [open_events(port, "/api/events") for _ in range(2)]
    try:
        assert not api.release.is_set()
        assert request(port, "/_next/ok")[0] == 200
        api.release.set()

        for _, response in streams:
            assert response.read() == b"data: two\n\n"
    finally:
        for client, _ in streams:
            client.close()

    api.release.clear()
    client, response = open_events(port, "/api/drain")
    try:
        process.send_signal(signal.SIGTERM)
        assert process.wait(timeout=4) == 0
        try:
            response.read()
        except http.client.IncompleteRead:
            pass
        else:
            raise AssertionError("Shutdown ended an infinite stream as a complete response")
    finally:
        client.close()


def main():
    with tempfile.TemporaryDirectory() as directory, upstream("frontend") as frontend:
        public = Path(directory) / "public"
        public.mkdir()
        config = public / "proxy.json"
        (public / "asset.txt").write_text("asset")
        (public / ".env").write_text("private")
        port = free_port()
        api_port = free_port()

        settings = {
            "server": {
                "host": "127.0.0.1", "port": port, "workers": 4, "queue": 8,
                "max_body_bytes": 4096, "max_header_bytes": 1024, "max_target_bytes": 128,
                "upstream_read_seconds": 2, "drain_seconds": 1
            },
            "static": {"enabled": True, "root": ".", "index": "index.html"},
            "upstreams": {
                "api": f"http://localhost:{api_port}",
                "frontend": f"http://127.0.0.1:{frontend.server_port}"
            },
            "routes": [
                {"path": "/asset.txt", "match": "exact", "action": "static"},
                {"path": "/api", "match": "prefix", "action": "proxy", "upstream": "api", "strip_prefix": True},
                {"path": "/api/status", "match": "exact", "action": "proxy", "upstream": "frontend"},
                {"path": "/", "match": "prefix", "action": "proxy", "upstream": "frontend"}
            ]
        }

        test_config(config, settings)
        with running(config, "127.0.0.1", port):
            assert request(port, "/api")[0] == 502

            with upstream("api", api_port):
                test_requests(port)

            assert request(port, "/api")[0] == 502
            with upstream("api", api_port):
                assert json.loads(request(port, "/api")[2])["upstream"] == "api"

        with upstream("api", api_port) as api, running(config, "127.0.0.1", port) as process:
            test_streams(port, api, process)

        settings["server"]["trusted_proxies"] = ["127.0.0.1"]
        settings["routes"] = []
        config.write_text(json.dumps(settings))
        with running(config, "127.0.0.1", port):
            assert request(port, "/.env")[0] == 404
            assert request(port, "/proxy.json")[0] == 404

        settings["routes"] = [
            {"path": "/", "match": "prefix", "action": "proxy", "upstream": "frontend"}
        ]
        config.write_text(json.dumps(settings))
        with running(config, "127.0.0.1", port):
            status, _, body = request(port, "/", headers={
                "Host": "[2001:db8::1]", "X-Forwarded-For": "192.0.2.42", "X-Forwarded-Proto": "https"
            })
            headers = json.loads(body)["headers"]
            assert status == 200
            assert headers["X-Forwarded-For"] == "192.0.2.42"
            assert headers["X-Forwarded-Proto"] == "https"
            assert headers["X-Forwarded-Port"] == "443"

    print("Proxy integration checks passed")


if __name__ == "__main__":
    main()
