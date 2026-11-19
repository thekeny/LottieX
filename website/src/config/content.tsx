import type { FaqItem, HostOption, NavItem, StartStep } from "./types";
import { INSTALL_COMMAND, SECTIONS } from "./links";

export const hostOptions: HostOption[] = [
    { label: "127.0.0.1", value: "127.0.0.1" },
    { label: "0.0.0.0", value: "0.0.0.0" },
    { label: "::1", value: "::1" },
];

const navItems: NavItem[] = [
    { label: "О проекте", href: SECTIONS.about.href },
    { label: "Быстрый старт", href: SECTIONS.start.href },
    { label: "Конфигурация", href: SECTIONS.config.href },
    { label: "Вопросы", href: SECTIONS.faq.href },
];

const startSteps: StartStep[] = [
    {
        id: "install",
        label: "Установка",
        comment: "# Linux x86_64: нужны curl, tar и sha256sum",
        code: INSTALL_COMMAND,
        result: "Команда lttx -> ~/.local/bin",
    },
    {
        id: "run",
        label: "Запуск",
        comment: "# В папке с lottiex.json",
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

const faqItems: FaqItem[] = [
    {
        id: "lan",
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
        id: "missing",
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
        id: "frameworks",
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
        id: "listen",
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
        id: "reload",
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
        id: "https",
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

const englishNavItems: NavItem[] = [
    { label: "About", href: SECTIONS.about.href },
    { label: "Quick start", href: SECTIONS.start.href },
    { label: "Configuration", href: SECTIONS.config.href },
    { label: "FAQ", href: SECTIONS.faq.href },
];

const englishStartSteps: StartStep[] = [
    {
        id: "install",
        label: "Install",
        comment: "# Linux x86_64: requires curl, tar and sha256sum",
        code: INSTALL_COMMAND,
        result: "Installs lttx in ~/.local/bin",
    },
    {
        id: "run",
        label: "Run",
        comment: "# In the directory containing lottiex.json",
        code: "lttx check\nlttx run",
        result: "Open http://127.0.0.1:8080",
    },
    {
        id: "request",
        label: "Test",
        comment: "# In a separate terminal",
        code: "curl -I http://127.0.0.1:8080/",
        result: "HEAD returns headers without a response body",
    },
];

const englishFaqItems: FaqItem[] = [
    {
        id: "lan",
        question: "How do I open the site from a phone or another computer?",
        answer: (
            <>
                Set <code>server.host</code> to <code>0.0.0.0</code> and restart the server. Connect both devices
                to the same local network. On the second device, open <code>http://SERVER-IP:8080</code> with
                the IP address of the machine running LottieX and your configured port. If the connection fails,
                check that the firewall allows traffic on that port. You can only reach <code>127.0.0.1</code>{" "}
                from the server itself.
            </>
        ),
    },
    {
        id: "missing",
        question: "Why does the server return 404 when the file exists?",
        answer: (
            <>
                Check that <code>static.enabled</code> is on and that <code>static.root</code> points to the
                site directory. Relative paths start from the directory containing the configuration file.
                Requests for a directory require the file named in <code>static.index</code>. Filenames are
                case-sensitive on Linux, so <code>Logo.png</code> and <code>logo.png</code> are different files.
                Symlinks that point outside the static root also return 404.
            </>
        ),
    },
    {
        id: "frameworks",
        question: "How do I serve a React or Vue build and handle routes?",
        answer: (
            <>
                Build the frontend and set <code>static.root</code> to the output directory, such as{" "}
                <code>./dist</code>. LottieX serves the build output. Run a separate dev server if you need one.
                Without an SPA fallback, reloading <code>/profile</code> returns 404 unless that file or
                directory exists. Use hash-based routing (<code>/#/profile</code>) or generate separate HTML pages.
            </>
        ),
    },
    {
        id: "listen",
        question: "What if the server cannot start on the selected port?",
        answer: (
            <>
                Run <code>lttx check</code> to validate the configuration and static directory. If the check passes,
                verify that the port is free and that the configured IP address belongs to this machine.
                Stop the process using the port or set <code>server.port</code> to another value, such as{" "}
                <code>8081</code>. Use a numeric IP address for <code>server.host</code>.
            </>
        ),
    },
    {
        id: "reload",
        question: "How do I apply changes to files and configuration?",
        answer: (
            <>
                Refresh the browser after editing HTML, CSS or JavaScript. If your frontend uses a build step,
                rebuild it into the directory LottieX serves first. After editing <code>lottiex.json</code>, stop
                the server with Ctrl+C and start it again. To use another configuration file, run{" "}
                <code>lttx run --config /path/to/lottiex.json</code>.
            </>
        ),
    },
    {
        id: "https",
        question: "Can I use HTTPS and connect my own backend?",
        answer: (
            <>
                Add the optional <code>upstreams</code> and <code>routes</code> to <code>lottiex.json</code> to serve
                static files and proxy HTTP services, including SSR and SSE, under one address. For public HTTPS,
                put a reverse proxy such as Caddy in front of LottieX. The repository includes an example.
                Run your REST API or backend as a separate service and let LottieX forward requests to it.
            </>
        ),
    },
];

const russian = {
    description: "LottieX — обратный прокси для хакатонов и MVP. Фронтенд, API и статика под одним адресом.",
    skip: "К содержимому",
    backToTop: "LottieX — в начало",
    launch: "Запустить LottieX",
    nav: {
        items: navItems,
        menu: "Меню",
        main: "Основная навигация",
        language: "Язык сайта",
        docs: "Документация",
        github: (stars: string) => `GitHub — репозиторий LottieX, ${stars} звёзд`,
    },
    hero: {
        heading: "Обратный прокси",
        subheading: "для хакатонов и MVP",
        intro: "Собери фронтенд, API и статику под одним адресом и покажи проект в деле.",
        playPronunciation: "Послушать произношение LottieX",
        audioError: "Не удалось воспроизвести произношение LottieX.",
        readDocs: "Читать документацию",
        copied: "Команда установки скопирована",
    },
    about: {
        heading: "Всё для статики.",
        subheading: "В одном исполняемом файле.",
        intro: <>Один <code>lttx</code>, один JSON-конфиг и твоя папка с сайтом. Статика, демо с хакатона или несколько HTTP-сервисов за одним адресом.</>,
        frontend: "Отдаёт твой фронтенд",
        frontendDescription: "HTML, CSS, JavaScript и изображения. GET, HEAD, MIME-типы и индексы директорий уже предусмотрены.",
        streaming: "Передаёт файлы блоками",
        streamingDescription: "Потоковая отправка без загрузки целого файла в строку. До 64 КиБ за один блок.",
        paths: "Проверяет пути",
        pathsDescription: "Выход за корневую папку и ведущие наружу симлинки получают ответ 404.",
    },
    start: {
        heading: "От установки",
        subheading: "до первого запроса",
        imageAlt: "Аксолотль LottieX с табличкой Install",
        releases: "Релизы на GitHub",
        stepsLabel: "Шаги запуска",
        copied: "Команда скопирована",
        steps: startSteps,
    },
    config: {
        heading: "Твоя папка.",
        subheading: "Твой порт. Твой сервер.",
        intro: <>Попробуй настройки здесь и скопируй готовый JSON в <code>lottiex.json</code>.</>,
        root: "Папка с сайтом",
        host: "IP-адрес",
        port: "Порт",
        index: "Индекс директории",
        invalid: "Проверь папку, порт (1–65535) и относительный индекс без .. в пути.",
        copied: "JSON скопирован",
    },
    copy: {
        button: "Копировать",
        selected: "Текст выделен. Нажми Ctrl+C для копирования.",
        failed: "Не удалось скопировать текст.",
    },
    faq: {
        heading: "Вопросы при запуске",
        items: faqItems,
    },
    closing: {
        heading: "Пора показать,",
        subheading: "что ты собрал",
    },
    footer: {
        copyright: "© 2026 Kenyka • Код под лицензией MIT",
        attribution: "LottieX — независимый проект, созданный без участия организаторов",
        contest: "олимпиады PROD",
        mascot: "Образ её маскота Лотти послужил визуальным референсом.",
        imageAlt: "Вращающийся Лотти",
    },
};

const english: typeof russian = {
    description: "LottieX is a reverse proxy for hackathons and MVPs. Serve your frontend, API and static files under one address.",
    skip: "Skip to content",
    backToTop: "LottieX — back to top",
    launch: "Run LottieX",
    nav: {
        items: englishNavItems,
        menu: "Menu",
        main: "Main navigation",
        language: "Site language",
        docs: "Documentation",
        github: (stars) => `GitHub — LottieX repository, ${stars} stars`,
    },
    hero: {
        heading: "Reverse proxy",
        subheading: "for hackathons and MVPs",
        intro: "Bring your frontend, API and static files under one address and show your project in action.",
        playPronunciation: "Hear how to pronounce LottieX",
        audioError: "Could not play the LottieX pronunciation.",
        readDocs: "Read the docs",
        copied: "Installation command copied",
    },
    about: {
        heading: "Serve static files",
        subheading: "with one executable.",
        intro: <>Use <code>lttx</code>, a JSON config and your site directory to serve a static site, a hackathon demo or several HTTP services under one address.</>,
        frontend: "Serves your frontend",
        frontendDescription: "Serve HTML, CSS, JavaScript and images with GET and HEAD, MIME types and directory indexes.",
        streaming: "Streams files in blocks",
        streamingDescription: "LottieX streams files in blocks of up to 64 KiB without loading the entire file into memory.",
        paths: "Checks file paths",
        pathsDescription: "Requests that try to leave the static root, including through symlinks, return 404.",
    },
    start: {
        heading: "From installation",
        subheading: "to your first request",
        imageAlt: "The LottieX axolotl holding an Install sign",
        releases: "GitHub releases",
        stepsLabel: "Quick start steps",
        copied: "Command copied",
        steps: englishStartSteps,
    },
    config: {
        heading: "Your directory.",
        subheading: "Your port. Your server.",
        intro: <>Try the settings here and copy the generated JSON into <code>lottiex.json</code>.</>,
        root: "Site directory",
        host: "IP address",
        port: "Port",
        index: "Directory index",
        invalid: "Check the site directory, port (1–65535) and relative index path. The index path must omit '..'.",
        copied: "JSON copied",
    },
    copy: {
        button: "Copy",
        selected: "Text selected. Press Ctrl+C to copy it.",
        failed: "Could not copy the text.",
    },
    faq: {
        heading: "Common setup questions",
        items: englishFaqItems,
    },
    closing: {
        heading: "Time to show",
        subheading: "what you built",
    },
    footer: {
        copyright: "© 2026 Kenyka • Code licensed under MIT",
        attribution: "LottieX is an independent project with no involvement from the organizers of the",
        contest: "PROD competition",
        mascot: "Its mascot, Lottie, inspired the design.",
        imageAlt: "Lottie spinning",
    },
};

export const content = { ru: russian, en: english };
export type Language = keyof typeof content;
