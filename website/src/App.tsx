import { About } from "./components/About";
import { Closing } from "./components/Closing";
import { Config } from "./components/Config";
import { Faq } from "./components/Faq";
import { Footer } from "./components/Footer";
import { Hero } from "./components/Hero";
import { Navbar } from "./components/Navbar";
import { Start } from "./components/Start";
import { ToastProvider } from "./components/Toast";
import { MAIN_CONTENT_ID } from "./config/links";
import { useIntroAnimation } from "./hooks/useIntroAnimation";

function App() {
    useIntroAnimation();

    return (
        <ToastProvider>
            <a
                href={`#${MAIN_CONTENT_ID}`}
                className="skip fixed left-5 top-[-80px] z-[60] bg-mint p-[14px] text-bg focus:top-3"
            >
                К содержимому
            </a>

            <Navbar />

            <main id={MAIN_CONTENT_ID}>
                <Hero />
                <About />
                <Start />
                <Config />
                <Faq />
                <Closing />
            </main>

            <Footer />
        </ToastProvider>
    );
}

export default App;
