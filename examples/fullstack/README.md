# Fullstack demo through LottieX

The demo puts a Next.js notes app and a FastAPI backend behind one origin. LottieX sends `/api` and its subpaths to the backend and strips the prefix. It sends the remaining URLs to Next.js. PostgreSQL stores notes, attachments and sessions on a named volume.

## Local HTTP

On Linux, install Docker with the Compose plugin and OpenSSL. From the repository root, start the demo:

```bash
./examples/fullstack/demo up
```

The first build downloads base images and application dependencies. LottieX itself builds with GNU Make and the dependencies bundled in the repository.

Open <http://127.0.0.1:8080>. Sign in as `demo` with the generated `DEMO_PASSWORD` in `examples/fullstack/.env`. Create a note, add some text and upload a file up to 1 MiB. You can reload the note URL directly or copy it to another tab in the same browser session. FastAPI runs its migration before reporting ready and adds a sample note on the first start.

```bash
./examples/fullstack/demo logs
./examples/fullstack/demo restart
./examples/fullstack/demo down
```

Run `up` again to reconnect to the existing volume. To permanently delete the HTTP demo database, run the following from `examples/fullstack/`:

```bash
docker compose -f compose.yaml -f compose.http.yaml down --volumes
```

Keep the generated `.env` while keeping the database volume. PostgreSQL only uses `POSTGRES_PASSWORD` from Compose to initialize an empty volume.

## Public HTTPS

1. Point your domain at the Linux host and allow incoming TCP ports 80 and 443. If the stack is running in HTTP mode, use `demo down` before switching.
2. Use the generated `.env` from the HTTP setup, or copy `.env.example` to `.env` and fill in independent random passwords of at least 16 characters using `openssl rand -hex 24`.
3. Set `DOMAIN` in `.env` to the public hostname, for example `notes.example.com`.
4. Run `./examples/fullstack/demo --https up` and open your domain over HTTPS.

Caddy publishes ports 80 and 443, obtains certificates and forwards to LottieX on a dedicated network. If `172.29.252.0/24` overlaps an existing network, update the subnet and Caddy address in the HTTPS Compose file and update `server.trusted_proxies` in the LottieX config together. FastAPI marks the session cookie `Secure` when LottieX forwards the HTTPS scheme. Only Caddy publishes ports in this mode. Use `--https` for `logs`, `restart` and `down` as well.

## Diagnostics

- **502** usually means Next.js or FastAPI failed to start or accept connections. Check `demo logs`. Use the response's `X-Request-Id` to match the failure to the LottieX log.
- **504** means LottieX timed out waiting for an upstream. Check the application and database logs before changing the upstream timeouts.
- **403 on a write** means the browser's origin and the scheme and host forwarded to FastAPI disagree. Check the domain and use the configured public URL.
- If Caddy cannot issue a certificate, check DNS, port reachability and its logs with `demo --https logs`.

This example is a single shared demo workspace. Everyone with the demo password can read and change its notes. Use sample data.

## Browser acceptance test

With the demo running and its password available as `DEMO_PASSWORD` in your shell, run from the repository root:

```bash
test_tools=$(mktemp -d)
npm install --prefix "$test_tools" playwright
"$test_tools/node_modules/.bin/playwright" install chromium
NODE_PATH="$test_tools/node_modules" node tests/fullstack.cjs --compose-restart
```

The test signs in, exercises CRUD and verifies attachment bytes, reloads a nested route and checks that logout invalidates the session. `--compose-restart` runs `down` and `up` and verifies that the note and attachment survive. Set `DEMO_URL=https://your-domain` to test the HTTPS endpoint and the `Secure` cookie.

## Quick reference

Run `./examples/fullstack/demo up` from the repository root and open <http://127.0.0.1:8080>. Sign in as `demo` with the `DEMO_PASSWORD` from `examples/fullstack/.env`. Running `demo down` preserves notes in the PostgreSQL volume. For a public deployment, set `DOMAIN` and run `demo --https up`. For a `502`, check that the services are running. For a `504`, investigate what is delaying the upstream response.
