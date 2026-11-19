# LottieX on a single virtual machine

This example brings multiple HTTP services together under one origin. Set the upstream names, addresses, ports and routes in the JSON configuration to match your project. Here, the API receives `/api/users?limit=10` as `/users?limit=10`, the `/grafana/` path stays intact and all remaining requests go to the frontend. The backend reaches PostgreSQL over a separate network.

## Docker Compose

From this directory, copy the template and fill in `.env`.

```bash
cp .env.example .env
```

- `FRONTEND_IMAGE` and `BACKEND_IMAGE` specify your images. Run production Next.js on `0.0.0.0:3000` and FastAPI on `0.0.0.0:8000`. Pass `--root-path /api` to FastAPI if the API needs to generate public URLs with that prefix.
- Set different values for `POSTGRES_PASSWORD` and `GRAFANA_ADMIN_PASSWORD`. The backend receives `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER` and `PGPASSWORD`. Configure your driver or application if it expects different variables. Have your backend startup command run migrations once PostgreSQL is ready.
- `PUBLIC_URL` specifies the address users open in their browser. Use an origin without a trailing slash, such as `http://192.0.2.10:8080` for direct HTTP by IP address.

For direct HTTP, open port `8080` and start the stack.

```bash
docker compose -f compose.yaml -f compose.http.yaml up -d --build
```

On the first run, Docker downloads the images and compiler packages. LottieX builds with GNU Make and the libraries bundled in the repository. Once the stack is running, open `PUBLIC_URL` for the frontend or `PUBLIC_URL/grafana/` for dashboards. Sign in to Grafana as `admin` with the password you set.

Use the same Compose override file (`compose.http.yaml` or `compose.https.yaml`) in the following commands.

```bash
docker compose -f compose.yaml -f compose.http.yaml ps
docker compose -f compose.yaml -f compose.http.yaml logs -f lottiex backend
docker compose -f compose.yaml -f compose.http.yaml restart lottiex
docker compose -f compose.yaml -f compose.http.yaml down
```

Use `down --volumes` to delete PostgreSQL and Grafana data. In HTTPS mode, this also deletes the certificate store. The plain `down` command preserves the volumes.

## HTTPS on a public domain

1. Point the DNS A record to the virtual machine's IPv4 address. Add an AAAA record if the virtual machine accepts public IPv6 connections.
2. Open incoming TCP ports `80` and `443` for Caddy. If the HTTP stack is running, stop it with `down` first.
3. In `.env`, set `DOMAIN=demo.example.com` and `PUBLIC_URL=https://demo.example.com`, using your own domain.
4. Start the stack and verify that the domain responds.

```bash
docker compose -f compose.yaml -f compose.https.yaml up -d --build
curl -I https://demo.example.com/
```

Caddy obtains and renews certificates with ACME, redirects HTTP to HTTPS and forwards requests to LottieX on the Compose network. LottieX trusts forwarded headers from Caddy at `172.29.251.2` on the dedicated `edge` network. If your virtual machine already uses that subnet, update the subnet, Caddy address and `trusted_proxies` entry together. To troubleshoot certificate issuance, run `docker compose -f compose.yaml -f compose.https.yaml logs caddy`. [Caddy Automatic HTTPS](https://caddyserver.com/docs/automatic-https)

## Running services without Docker

Bind the services to loopback. In this example, Next.js listens on `127.0.0.1:3000`, FastAPI on `127.0.0.1:8000` and Grafana on `127.0.0.1:3001`. Set Grafana's `root_url` to the public URL ending in `/grafana/` and set `serve_from_sub_path = true`. [Running Grafana behind a reverse proxy](https://grafana.com/tutorials/run-grafana-behind-a-proxy/)

Run the installation and startup commands from the repository root.

```bash
./scripts/install.sh
lttx check --config examples/reverse-proxy/lottiex.vm.json
lttx run --config examples/reverse-proxy/lottiex.vm.json
```

For HTTPS without Docker, set `server.host` to `127.0.0.1` and add `"trusted_proxies": ["127.0.0.1"]` under `server` in the LottieX configuration. In the Caddyfile, replace `lottiex:8080` with `127.0.0.1:8080` and keep the public domain as the site address. For direct HTTP by IP address, use the VM configuration as provided.

## Static export

To serve static files, set `static.enabled` to `true`, point `static.root` to the build output directory and change the `/` route's action to `static`. Remove the route's `upstream` field. For a Next.js static export, use `output: 'export'` and `trailingSlash: true`. Nested pages will each have their own directory and `index.html`. [Next.js static exports](https://nextjs.org/docs/app/guides/static-exports)

<a name="диагностика"></a>

## Troubleshooting

- For a `502`, check the service address, port, status and listening interface. In Docker, the upstream should listen on the container interface and the hostname in the URL should match the Compose service name.
- For a `504`, check the upstream response time and the `upstream_connect_seconds`, `upstream_read_seconds` and `upstream_write_seconds` settings. Use `X-Request-Id` to find the request in the LottieX and application logs if the application logs that header.
- If a redirect points to an internal address, check the application's public origin and its settings for trusting forwarded headers. FastAPI behind a proxy must trust the LottieX address. Grafana uses `GF_SERVER_ROOT_URL`.
- SSR and SSE use one worker per open stream. With the default settings, two SSE streams leave six workers for other traffic. Regular Grafana pages and dashboards use HTTP. Grafana Live requires WebSocket support.
