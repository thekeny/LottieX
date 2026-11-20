export const REPOSITORY = {
    name: "thekeny/LottieX",
    url: "https://github.com/thekeny/LottieX",
    apiUrl: "https://api.github.com/repos/thekeny/LottieX",
    fallbackStars: 0,
    docsUrl: {
        ru: "https://github.com/thekeny/LottieX/blob/master/docs/ru.md",
        en: "https://github.com/thekeny/LottieX/blob/master/docs/en.md",
    },
    releasesUrl: "https://github.com/thekeny/LottieX/releases",
    licenseUrl: "https://github.com/thekeny/LottieX/blob/master/LICENSE",
} as const;

export const INSTALL_COMMAND =
    "curl -fsSL https://thekeny.github.io/LottieX/install.sh | bash";

export const PARTNER_SITES = {
    cu: "https://cu.ru/",
    hse: "https://www.hse.ru/",
    tbank: "https://www.tbank.ru/",
} as const;

export const SECTIONS = {
    top: { id: "top", href: "#top" },
    about: { id: "about", href: "#about" },
    start: { id: "start", href: "#start" },
    config: { id: "config", href: "#config" },
    faq: { id: "faq", href: "#faq" },
} as const;

export const MAIN_CONTENT_ID = "main";
