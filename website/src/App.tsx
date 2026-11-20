import { useEffect, useState } from "react";
import { Toaster } from "react-hot-toast";
import { About } from "./components/About";
import { Closing } from "./components/Closing";
import { Config } from "./components/Config";
import { Faq } from "./components/Faq";
import { Footer } from "./components/Footer";
import { Hero } from "./components/Hero";
import { Navbar } from "./components/Navbar";
import { Partners } from "./components/Partners";
import { Start } from "./components/Start";
import { content } from "./config/content";
import { LanguageContext, loadLanguage, saveLanguage } from "./config/language";
import { MAIN_CONTENT_ID } from "./config/links";
import { useIntroAnimation } from "./hooks/useIntroAnimation";
import { useScrollReveal } from "./hooks/useScrollReveal";

function App() {
    const [language, setLanguage] = useState(loadLanguage);
    const copy = content[language];

    useEffect(() => {
        document.documentElement.lang = language;
        document.querySelector('meta[name="description"]')?.setAttribute("content", copy.description);
        saveLanguage(language);
    }, [language, copy]);

    useIntroAnimation();
    useScrollReveal();

    return (
        <LanguageContext.Provider value={{ language, setLanguage }}>
            <a
                href={`#${MAIN_CONTENT_ID}`}
                className="skip fixed left-5 -top-20 z-60 bg-mint p-3.5 text-bg focus:top-3"
            >
                {copy.skip}
            </a>

            <Navbar />

            <main id={MAIN_CONTENT_ID}>
                <Hero />
                <About />
                <Start />
                <Config />
                <Faq />
                <Partners />
                <Closing />
            </main>

            <Footer />

            <Toaster
                position="bottom-right"
                gutter={12}
                toastOptions={{
                    duration: 2500,
                    style: {
                        background: "var(--color-mint)",
                        color: "#143722",
                        borderRadius: 0,
                        padding: "14px 20px",
                        fontFamily: "var(--font-mono)",
                        fontSize: "13px",
                        lineHeight: "1.5",
                        boxShadow: "0 12px 30px rgba(0, 0, 0, 0.35)",
                    },
                }}
            />
        </LanguageContext.Provider>
    );
}

export default App;
