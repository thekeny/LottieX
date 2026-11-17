"""Run against a built binary: python3 tests/smoke.py."""

import concurrent.futures
from contextlib import contextmanager
import json
from pathlib import Path
import signal
import socket
import subprocess
import tempfile
import time

from common import BINARY, cli


@contextmanager
def running(config, host, port):
    process = subprocess.Popen(
        [BINARY, "run", "--config", config],
        stdout=subprocess.DEVNULL
    )

    try:
        for _ in range(100):
            try:
                with socket.create_connection((host, port), timeout=.1):
                    break
            except OSError:
                if process.poll() is not None:
                    raise RuntimeError("Server exited at startup")
                time.sleep(.05)
        else:
            raise RuntimeError("Server did not start")

        yield process
    finally:
        if process.poll() is None:
            process.send_signal(signal.SIGTERM)
            try:
                process.wait(timeout=35)
            except subprocess.TimeoutExpired:
                process.kill()
                process.wait()
                raise

        assert process.returncode == 0, process.returncode


def receive(client):
    chunks = []

    while chunk := client.recv(65536):
        chunks.append(chunk)

    header, body = b"".join(chunks).split(b"\r\n\r\n", 1)
    return int(header.split()[1]), header, body


def main():
    assert "Usage:" in cli("help").stdout
    assert "LottieX" in cli("version").stdout
    cli("unknown", success=False)
    cli("run", "--config", success=False)

    with tempfile.TemporaryDirectory() as directory:
        root = Path(directory)
        public = root / "public"
        public.mkdir()

        (public / "index.html").write_bytes(b"hello")
        (public / "empty.txt").write_bytes(b"")

        large = bytes(range(256)) * 8192
        (public / "large.bin").write_bytes(large)

        (public / "%2e%2e").mkdir()
        (public / "%2e%2e" / "literal.txt").write_bytes(b"decoded once")

        (public / "sub").mkdir()
        (public / "sub" / "index.html").write_bytes(b"nested")
        (public / "custom.html").write_bytes(b"custom index")

        (root / "secret").write_bytes(b"secret")
        (public / "escape").symlink_to(root / "secret")
        (public / "outside").symlink_to(root, target_is_directory=True)
        (public / "inside").symlink_to(public / "sub", target_is_directory=True)

        with socket.socket() as probe:
            probe.bind(("127.0.0.1", 0))
            port = probe.getsockname()[1]

        config = root / "config.json"
        settings = {
            "server": {
                "host": "127.0.0.1",
                "port": port
            },
            "static": {
                "enabled": True,
                "root": "public",
                "index": "index.html"
            }
        }

        def save():
            config.write_text(json.dumps(settings))

        def request(path="/", method="GET", raw=None):
            with socket.create_connection(("127.0.0.1", port), timeout=3) as client:
                client.sendall(
                    raw or f"{method} {path} HTTP/1.1\r\nHost: localhost\r\n\r\n".encode()
                )
                return receive(client)

        save()
        cli("check", "--config", config)

        with running(config, "127.0.0.1", port) as process:
            cli("run", "--config", config, success=False)  # Occupied port

            status, headers, body = request()
            assert status == 200 and body == b"hello"
            assert b"Server: LottieX" in headers and b"Connection: close" in headers
            assert b"Content-Type: text/html; charset=utf-8" in headers

            status, headers, body = request(method="HEAD")
            assert status == 200 and b"Content-Length: 5" in headers and not body

            assert request("/?x=1")[2] == b"hello"
            assert request("/sub/")[2] == b"nested"
            assert request("/inside/")[2] == b"nested"
            assert request("/%252e%252e/literal.txt")[2] == b"decoded once"

            assert request("/large.bin")[2] == large
            status, headers, body = request("/large.bin", method="HEAD")
            assert status == 200 and f"Content-Length: {len(large)}".encode() in headers and not body
            assert b"Content-Type: application/octet-stream" in headers

            status, headers, body = request("/empty.txt")
            assert status == 200 and b"Content-Length: 0" in headers and not body

            for path in (
                "/missing",
                "/../secret",
                "/%2e%2e/secret",
                "/escape",
                "/outside/secret"
            ):
                assert request(path)[0] == 404, path

            for path in ("/%zz", "/%00", "/%5csecret", "/%"):
                assert request(path)[0] == 400, path

            for method in ("POST", "PUT", "DELETE", "OPTIONS", "PATCH", "TRACE"):
                status, headers, _ = request(method=method)
                assert status == 405 and b"Allow: GET, HEAD" in headers, method

            assert request(raw=b"GET / HTTP/1.1\r\n\r\n")[0] == 400
            assert request(raw=b"GET / HTTP/1.1\r\nHost: a\r\nHost: b\r\n\r\n")[0] == 400

            with concurrent.futures.ThreadPoolExecutor(max_workers=8) as executor:
                assert all(
                    result[0] == 200
                    for result in executor.map(lambda _: request(), range(32))
                )

            process.send_signal(signal.SIGINT)
            assert process.wait(timeout=7) == 0

        settings["static"]["index"] = "custom.html"
        save()
        with running(config, "127.0.0.1", port):
            assert request()[2] == b"custom index"

        # Stop accepting while an existing client is still sending its headers.
        save()
        with running(config, "127.0.0.1", port) as process:
            with socket.create_connection(("127.0.0.1", port), timeout=3) as client:
                client.sendall(b"GET /large.bin HTTP/1.1\r\nHost: localhost\r\n")

                time.sleep(.1)
                process.send_signal(signal.SIGTERM)
                time.sleep(.2)
                assert process.poll() is None

                client.sendall(b"\r\n")
                assert receive(client)[2] == large

            assert process.wait(timeout=7) == 0

        settings["static"]["enabled"] = False
        settings["static"]["root"] = "nonexistent"
        save()
        cli("check", "--config", config)

        with running(config, "127.0.0.1", port):
            assert request()[0] == 404
            assert request(method="HEAD")[0::2] == (404, b"")
            assert request(method="POST")[0] == 405

        for field, value in (
            ("host", "localhost"),
            ("host", "127.0.0.1\0bad"),
            ("port", 0),
            ("port", 65536)
        ):
            old = settings["server"][field]
            settings["server"][field] = value
            save()
            cli("check", "--config", config, success=False)
            settings["server"][field] = old

        for index in ("../secret", "/absolute", ""):
            settings["static"]["index"] = index
            save()
            cli("check", "--config", config, success=False)

        settings["static"]["index"] = "index.html"
        settings["server"]["host"] = "::1"
        save()
        cli("check", "--config", config)

        try:
            with socket.socket(socket.AF_INET6) as probe:
                probe.bind(("::1", 0))
                settings["server"]["port"] = probe.getsockname()[1]
        except OSError:
            print("IPv6 listener check skipped: loopback unavailable")
        else:
            save()
            with running(config, "::1", settings["server"]["port"]):
                with socket.create_connection(
                    ("::1", settings["server"]["port"]), timeout=3
                ) as client:
                    client.sendall(b"GET / HTTP/1.1\r\nHost: [::1]\r\n\r\n")
                    assert receive(client)[0] == 404

    print("HTTP integration checks passed")


if __name__ == "__main__":
    main()
