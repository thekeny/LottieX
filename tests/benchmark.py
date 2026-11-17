"""Compare LottieX and nginx on Linux using the same HTTP backend."""

import argparse
from concurrent.futures import ProcessPoolExecutor
from contextlib import contextmanager
import http.client
import json
import math
from pathlib import Path
import platform
import signal
import statistics
import subprocess
import tempfile
import time
from urllib.parse import urlsplit

from common import BINARY
from proxy import free_port
from smoke import running


def load(port, path, expected, requests):
    durations = []
    errors = 0

    for _ in range(requests):
        client = http.client.HTTPConnection("127.0.0.1", port, timeout=5)
        started = time.perf_counter_ns()
        try:
            client.request("GET", path, headers={"Connection": "close"})
            response = client.getresponse()
            if response.status == 200 and response.read() == expected:
                durations.append((time.perf_counter_ns() - started) / 1_000_000)
            else:
                errors += 1
        except (OSError, http.client.HTTPException):
            errors += 1
        finally:
            client.close()

    return durations, errors


def measure(pool, port, path, expected, clients, requests):
    start = time.perf_counter()
    futures = [pool.submit(load, port, path, expected, requests) for _ in range(clients)]
    latencies = []
    errors = 0

    for future in futures:
        times, failures = future.result()
        latencies.extend(times)
        errors += failures

    elapsed = time.perf_counter() - start
    latencies.sort()
    p95 = latencies[math.ceil(len(latencies) * 0.95) - 1] if latencies else None
    return {"requests_per_second": len(latencies) / elapsed, "p95_ms": p95, "errors": errors}


def memory_kib(pid):
    path = Path(f"/proc/{pid}")
    children = (path / "task" / str(pid) / "children").read_text().split()

    with (path / "smaps_rollup").open() as stats:
        own = next(int(line.split()[1]) for line in stats if line.startswith("Pss:"))

    return own + sum(memory_kib(int(child)) for child in children)


@contextmanager
def nginx_server(binary, directory, port, upstream):
    config = directory / "nginx.conf"
    config.write_text(f"""
worker_processes 8;
daemon off;
pid {directory}/nginx.pid;
error_log stderr error;
events {{ worker_connections 256; }}
http {{
    log_format benchmark '$time_iso8601 $request_method $uri $status $request_time $body_bytes_sent $upstream_addr $request_id';
    access_log /dev/stdout benchmark;
    sendfile on;
    keepalive_timeout 0;
    server {{
        listen 127.0.0.1:{port};
        root {directory}/public;
        location /api/ {{
            proxy_pass {upstream}/;
            proxy_http_version 1.1;
            proxy_set_header Connection close;
            proxy_set_header Host $http_host;
            proxy_set_header X-Forwarded-For $remote_addr;
            proxy_set_header X-Forwarded-Host $http_host;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_set_header X-Forwarded-Port $server_port;
            proxy_set_header X-Request-Id $request_id;
            proxy_buffering off;
            proxy_next_upstream off;
        }}
    }}
}}
""")

    with subprocess.Popen(
        [binary, "-p", str(directory), "-c", str(config), "-e", "stderr"],
        stdout=subprocess.DEVNULL
    ) as process:
        try:
            for _ in range(100):
                if process.poll() is not None:
                    raise RuntimeError("nginx exited at startup")

                times, _ = load(port, "/asset.bin", b"A" * 16384, 1)
                if times:
                    break

                time.sleep(0.05)
            else:
                raise RuntimeError("nginx did not start")

            yield process
        finally:
            if process.poll() is None:
                process.send_signal(signal.SIGQUIT)
                process.wait(timeout=10)


def backend_response(upstream):
    url = urlsplit(upstream)
    if (
        url.scheme != "http" or not url.hostname or not url.port or url.username
        or url.path or url.query or url.fragment or not url.hostname.isascii()
        or any(char not in "abcdefghijklmnopqrstuvwxyz0123456789.-:" for char in url.hostname.lower())
    ):
        raise ValueError("Backend must be an HTTP origin with an explicit port")

    client = http.client.HTTPConnection(url.hostname, url.port, timeout=5)
    try:
        client.request("GET", "/bench")
        response = client.getresponse()
        if response.status != 200:
            raise RuntimeError("Backend GET /bench must return 200")
        return response.read()
    finally:
        client.close()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--nginx", default="nginx", help="path to nginx")
    parser.add_argument("--backend", required=True, help="HTTP origin serving a fixed GET /bench")
    parser.add_argument("--requests", type=int, default=500, help="requests per client per run")
    args = parser.parse_args()
    if args.requests < 1:
        parser.error("--requests must be positive")

    proxy_body = backend_response(args.backend)
    host = platform.platform()
    cpu = next(line.split(": ", 1)[1] for line in Path("/proc/cpuinfo").read_text().splitlines()
               if line.startswith("model name"))
    versions = {
        "lottiex": subprocess.check_output([BINARY, "version"], text=True).strip(),
        "nginx": subprocess.check_output([args.nginx, "-v"], stderr=subprocess.STDOUT, text=True).strip()
    }
    print(json.dumps({"system": host, "cpu": cpu, "versions": versions, "requests": args.requests}), flush=True)

    with tempfile.TemporaryDirectory() as temporary, ProcessPoolExecutor(max_workers=8) as pool:
        directory = Path(temporary)
        asset = b"A" * 16384
        (directory / "public").mkdir()
        (directory / "public/asset.bin").write_bytes(asset)

        lottiex_port, nginx_port = free_port(), free_port()
        config = directory / "lottiex.json"
        config.write_text(json.dumps({
            "server": {"host": "127.0.0.1", "port": lottiex_port},
            "static": {"enabled": True, "root": "public", "index": "index.html"},
            "upstreams": {"api": args.backend},
            "routes": [
                {"path": "/api", "match": "prefix", "action": "proxy", "upstream": "api", "strip_prefix": True}
            ]
        }))

        with (
            running(config, "127.0.0.1", lottiex_port) as lottiex,
            nginx_server(args.nginx, directory, nginx_port, args.backend) as nginx
        ):
            servers = (("lottiex", lottiex_port, lottiex.pid), ("nginx", nginx_port, nginx.pid))
            for path, expected in (("/asset.bin", asset), ("/api/bench", proxy_body)):
                for clients in (1, 8):
                    results = {name: [] for name, _, _ in servers}
                    for _, port, _ in servers:
                        measure(pool, port, path, expected, clients, 50)

                    for iteration in range(3):
                        order = servers if iteration % 2 == 0 else reversed(servers)
                        for name, port, pid in order:
                            sample = measure(pool, port, path, expected, clients, args.requests)
                            sample["pss_kib"] = memory_kib(pid)
                            results[name].append(sample)

                    for name, samples in results.items():
                        print(json.dumps({
                            "server": name, "path": path, "clients": clients, "body_bytes": len(expected),
                            "median_rps": round(statistics.median(sample["requests_per_second"] for sample in samples)),
                            "runs": samples
                        }), flush=True)


if __name__ == "__main__":
    main()
