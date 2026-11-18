# LottieX на одной виртуалке

Этот пример соединяет любые HTTP-сервисы под одним origin. Замените имена upstream, адреса, порты и маршруты в JSON под свой проект. В примере `/api/users?limit=10` приходит в API как `/users?limit=10`, `/grafana/` сохраняется целиком, а остальные запросы идут во фронтенд. PostgreSQL доступен бэкенду по отдельной сети.

## Docker Compose

Из этого каталога скопируйте шаблон и заполните `.env`.

```bash
cp .env.example .env
```

- `FRONTEND_IMAGE` и `BACKEND_IMAGE` задают ваши образы. Запускайте production-версию Next.js на `0.0.0.0:3000`, а FastAPI на `0.0.0.0:8000`. Укажите FastAPI `--root-path /api`, если API должно генерировать публичные URL с этим префиксом.
- `POSTGRES_PASSWORD` и `GRAFANA_ADMIN_PASSWORD` задают разные пароли. Бэкенд получает `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER` и `PGPASSWORD`. Настройте драйвер или параметры приложения, если оно использует другие переменные. Миграции выполняет командный запуск вашего бэкенда после готовности PostgreSQL.
- `PUBLIC_URL` задаёт адрес, который будет открывать браузер. Укажите origin без завершающего слэша, например `http://192.0.2.10:8080` для HTTP по IP.

Для прямого HTTP откройте порт `8080` и выполните команду запуска.

```bash
docker compose -f compose.yaml -f compose.http.yaml up -d --build
```

При первом старте Docker скачает образы и пакеты компилятора. Сам LottieX собирается через GNU Make с библиотеками из репозитория. После запуска откройте `PUBLIC_URL` для фронтенда или `PUBLIC_URL/grafana/` для дашбордов. Вход в Grafana использует логин `admin` и заданный пароль.

В следующих командах используйте тот же файл запуска (`compose.http.yaml` или `compose.https.yaml`).

```bash
docker compose -f compose.yaml -f compose.http.yaml ps
docker compose -f compose.yaml -f compose.http.yaml logs -f lottiex backend
docker compose -f compose.yaml -f compose.http.yaml restart lottiex
docker compose -f compose.yaml -f compose.http.yaml down
```

Чтобы удалить данные PostgreSQL и Grafana, выполните `down --volumes`. В HTTPS-варианте эта команда также удаляет хранилище сертификатов. Обычный `down` сохраняет тома.

## HTTPS на публичном домене

1. Направьте DNS-запись A на IPv4 виртуалки. Добавляйте AAAA, если виртуалка принимает публичные IPv6-подключения.
2. Откройте входящие TCP-порты `80` и `443` для Caddy. Если раньше работал вариант HTTP, сначала выполните его `down`.
3. В `.env` задайте `DOMAIN=demo.example.com` и `PUBLIC_URL=https://demo.example.com`, подставив свой домен.
4. Выполните команду запуска и проверьте домен.

```bash
docker compose -f compose.yaml -f compose.https.yaml up -d --build
curl -I https://demo.example.com/
```

Caddy получает и продлевает сертификат через ACME, перенаправляет HTTP на HTTPS и пересылает запросы в LottieX внутри сети Compose. LottieX доверяет заголовкам Caddy от `172.29.251.2` в выделенной сети `edge`. Если подсеть уже используется на виртуалке, поменяйте её, адрес Caddy и запись `trusted_proxies` вместе. Диагностика получения сертификата доступна через `docker compose -f compose.yaml -f compose.https.yaml logs caddy`. [Автоматический HTTPS в Caddy](https://caddyserver.com/docs/automatic-https)

## Запуск процессов без Docker

Запустите сервисы на loopback. По примеру Next.js слушает `127.0.0.1:3000`, FastAPI — `127.0.0.1:8000`, Grafana — `127.0.0.1:3001`. В настройках Grafana задайте `root_url` с публичным адресом и суффиксом `/grafana/`, а также `serve_from_sub_path = true`. [Настройка Grafana за reverse proxy](https://grafana.com/tutorials/run-grafana-behind-a-proxy/)

Выполните команды установки и запуска из корня репозитория.

```bash
./scripts/install.sh
lttx check --config examples/reverse-proxy/lottiex.vm.json
lttx run --config examples/reverse-proxy/lottiex.vm.json
```

Для HTTPS без Docker задайте в конфиге LottieX `server.host` равным `127.0.0.1`, добавьте `"trusted_proxies": ["127.0.0.1"]`, а в Caddyfile замените `lottiex:8080` на `127.0.0.1:8080`. Сохраните публичный домен в адресе сайта Caddy. Для прямого HTTP по IP используйте VM-конфиг как есть.

## Статический экспорт

Для статики установите `static.enabled` в `true`, укажите в `static.root` отдельный каталог артефактов и замените действие маршрута `/` на `static`. Удалите из этого маршрута поле `upstream`. Для Next.js static export используйте `output: 'export'` и `trailingSlash: true`. Вложенные страницы будут лежать в каталогах со своим `index.html`. [Статический экспорт Next.js](https://nextjs.org/docs/app/guides/static-exports)

## Диагностика

- При `502` проверьте адрес, порт, состояние сервиса и его слушающий интерфейс. В Docker upstream должен слушать интерфейс контейнера, а имя в URL должно совпадать с именем сервиса в Compose.
- При `504` проверьте время ответа сервиса и параметры `upstream_connect_seconds`, `upstream_read_seconds` и `upstream_write_seconds`. По `X-Request-Id` можно найти запрос в журналах LottieX и приложения, если приложение пишет этот заголовок в лог.
- При редиректе на внутренний адрес проверьте публичный origin приложения и настройки доверия к forwarded-заголовкам. FastAPI за прокси должен доверять адресу LottieX. Grafana использует `GF_SERVER_ROOT_URL`.
- SSR и SSE используют один worker на открытый поток. С настройкой по умолчанию два SSE-потока оставляют шесть workers для остального трафика. Для обычных страниц и дашбордов Grafana используется HTTP. Grafana Live требует поддержки WebSocket.
