import { createContext, useContext } from "react";
import { content } from "./content";
import type { Language } from "./content";

const storageKey = "lottiex-language";

export function isLanguage(value: string | null): value is Language {
    return value === "ru" || value === "en";
}

export function loadLanguage(): Language {
    try {
        const saved = window.localStorage.getItem(storageKey);
        if (isLanguage(saved)) {
            return saved;
        }
    } catch {
        // The selector still works when storage is unavailable.
    }

    return "ru";
}

export function saveLanguage(language: Language): void {
    try {
        window.localStorage.setItem(storageKey, language);
    } catch {
        // The choice still applies to the current page.
    }
}

export const LanguageContext = createContext<{
    language: Language;
    setLanguage: (language: Language) => void;
}>({
    language: "ru",
    setLanguage: () => {},
});

export function useLanguage() {
    const { language, setLanguage } = useContext(LanguageContext);
    return { language, setLanguage, copy: content[language] };
}
