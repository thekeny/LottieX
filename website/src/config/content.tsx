import type { FaqItem, HostOption, NavItem, StartStep } from "./types";
import { INSTALL_COMMAND, SECTIONS } from "./links";

export const navItems: NavItem[] = [
    { label: "О проекте", href: SECTIONS.about.href },
    { label: "Быстрый старт", href: SECTIONS.start.href },
    { label: "Конфигурация", href: SECTIONS.config.href },
    { label: "Вопросы", href: SECTIONS.faq.href },
];

export const startSteps: StartStep[] = [
    {
        id: "install",
        label: "Установка",
        comment: "# Без Git: нужны curl, tar, make и C++20",
        code: INSTALL_COMMAND,
        result: "Команда lttx -> ~/.local/bin",
    },
    {
        id: "run",
        label: "Запуск",
        comment: "# Сначала проверь конфигурацию",
        code: "lttx check\nlttx run",
        result: "Открой http://127.0.0.1:8080",
    },
    {
        id: "request",
        label: "Проверка",
        comment: "# В другом терминале",
        code: "curl -I http://127.0.0.1:8080/",
        result: "HEAD -> заголовки без тела ответа",
    },
];

export const hostOptions: HostOption[] = [
    { label: "127.0.0.1", value: "127.0.0.1" },
    { label: "0.0.0.0", value: "0.0.0.0" },
    { label: "::1", value: "::1" },
];

export const faqItems: FaqItem[] = [
    {
        question: "Как открыть сайт с телефона или другого компьютера?",
        answer: (
            <>
                Укажи <code>server.host: "0.0.0.0"</code> и перезапусти сервер. Подключи устройства к одной локальной
                сети и открой на втором устройстве <code>http://IP-компьютера:8080</code>, подставив адрес компьютера с
                LottieX и свой порт. Если соединения нет, проверь доступ к порту в файрволе. Адрес{" "}
                <code>127.0.0.1</code> доступен только на самом компьютере с сервером.
            </>
        ),
    },
    {
        question: "Почему сервер возвращает 404, хотя файл есть?",
        answer: (
            <>
                Проверь, что <code>static.enabled</code> включён, а <code>static.root</code> указывает на папку с
                сайтом: относительный путь считается от папки конфига. Для запроса к директории нужен файл из{" "}
                <code>static.index</code>. Учитывай регистр имён в Linux: <code>Logo.png</code> и <code>logo.png</code> —
                разные файлы. Симлинки за пределы корня тоже получают 404.
            </>
        ),
    },
    {
        question: "Как раздать сборку React или Vue и что будет с маршрутами?",
        answer: (
            <>
                Собери фронтенд и укажи папку результата, например <code>./dist</code>, в <code>static.root</code>.
                LottieX раздаёт готовые файлы, но не запускает dev-сервер. SPA fallback отсутствует: при обновлении
                страницы <code>/profile</code> сервер вернёт 404, если такого файла или директории нет. Используй
                маршрутизацию через хеш (<code>/#/profile</code>) или сборку с отдельными HTML-страницами.
            </>
        ),
    },
    {
        question: "Что делать, если сервер не запускается на выбранном порту?",
        answer: (
            <>
                Сначала выполни <code>lttx check</code>: команда проверит конфиг и папку с файлами. Если
                проверка проходит, проверь, свободен ли порт и принадлежит ли указанный IP этому компьютеру. Останови
                процесс, занявший порт, или измени <code>server.port</code>, например на <code>8081</code>. Для{" "}
                <code>server.host</code> нужен числовой IP: значение <code>localhost</code> не принимается.
            </>
        ),
    },
    {
        question: "Как применить изменения в файлах и конфигурации?",
        answer: (
            <>
                После изменения HTML, CSS или JavaScript достаточно обновить страницу в браузере; собранный фронтенд
                сначала пересобери в папку раздачи. После правки <code>lottiex.json</code> останови сервер через Ctrl+C
                и запусти заново. Для другого конфига используй{" "}
                <code>lttx run --config /путь/к/lottiex.json</code>.
            </>
        ),
    },
    {
        question: "Можно ли подключить HTTPS и свой бэкенд?",
        answer: (
            <>
                LottieX раздаёт статику и проксирует HTTP-сервисы: добавь необязательные{" "}
                <code>upstreams</code> и <code>routes</code> в <code>lottiex.json</code>, и несколько приложений будут
                доступны с одного адреса, включая SSR и SSE. Встроенного HTTPS нет — для публичного адреса поставь
                впереди reverse proxy вроде Caddy, пример есть в репозитории. REST API и бэкенд запускай отдельно:
                LottieX только передаёт запросы.
            </>
        ),
    },
];
