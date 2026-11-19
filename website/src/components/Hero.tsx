import { Volume2 } from "lucide-react";
import { useRef } from "react";
import { toast } from "react-hot-toast";
import { images } from "../config/images";
import { useLanguage } from "../config/language";
import { INSTALL_COMMAND, REPOSITORY, SECTIONS } from "../config/links";
import { LinkButton } from "./LinkButton";
import { Terminal } from "./Terminal";

export function Hero() {
    const { language, copy } = useLanguage();
    const installRef = useRef<HTMLElement>(null);
    const pronunciationRef = useRef<HTMLAudioElement>(null);

    const playPronunciation = async () => {
        const audio = pronunciationRef.current;
        if (!audio) return;

        try {
            audio.currentTime = 0;
            await audio.play();
        } catch {
            toast.error(copy.hero.audioError);
        }
    };

    return (
        <section
            id={SECTIONS.top.id}
            className="hero wrap flex flex-col pb-6 pt-8 max-md:pb-5.5 max-md:pt-6 2xl:justify-center"
        >
            <img
                className="hero-logo mb-11 mt-9 h-auto w-full max-md:mb-8"
                src={images.logo}
                alt="LottieX"
                width={2752}
                height={640}
                fetchPriority="high"
            />

            <div className="hero-bottom grid items-start max-md:grid-cols-1 max-md:gap-8 md:max-lg:grid-cols-2 md:max-lg:gap-9">
                <div>
                    <h1 className="mb-3 mt-0 text-hero-heading leading-none tracking-tighter max-lg:text-3xl max-lg:tracking-tight max-md:text-hero-mobile">
                        {copy.hero.heading}
                        <br />
                        {copy.hero.subheading}
                    </h1>
                    <div className="mb-3 flex items-center gap-2 text-sm text-muted">
                        <p>
                            {language === "ru" && <span lang="ru">Ло́тти Экс · </span>}
                            <span lang="en">LOTT-ee eks /ˈlɒti ɛks/</span>
                        </p>
                        <button
                            type="button"
                            aria-label={copy.hero.playPronunciation}
                            title={copy.hero.playPronunciation}
                            onClick={playPronunciation}
                            className="grid size-11 shrink-0 place-items-center text-mint transition-colors hover:bg-mint/10 active:bg-mint/20"
                        >
                            <Volume2 aria-hidden="true" size={20} strokeWidth={1.5} />
                        </button>
                        <audio
                            ref={pronunciationRef}
                            src={`${import.meta.env.BASE_URL}lottiex-pronunciation.mp3`}
                            preload="none"
                            hidden
                        />
                    </div>
                    <p className="mb-7 mt-0 text-base text-muted max-md:mb-6 max-md:text-sm">
                        {copy.hero.intro}
                    </p>
                    <div className="flex flex-wrap items-center gap-6.5 max-lg:gap-5">
                        <LinkButton href={SECTIONS.start.href}>{copy.launch}</LinkButton>
                        <LinkButton variant="secondary" href={REPOSITORY.docsUrl[language]} external>
                            {copy.hero.readDocs}
                        </LinkButton>
                    </div>
                </div>

                <Terminal
                    title="~/lottiex"
                    copy={{ text: INSTALL_COMMAND, message: copy.hero.copied, source: installRef }}
                >
                    <div className="px-6 py-5 font-mono text-sm leading-relaxed max-md:px-5 max-md:py-4 max-md:text-xs">
                        <p className="mb-1 break-all">
                            <span className="pr-2 text-mint">$</span>
                            <code ref={installRef}>{INSTALL_COMMAND}</code>
                        </p>
                        <p className="mb-1">
                            <span className="pr-2 text-mint">$</span>
                            lttx check
                        </p>
                        <p className="mb-1 text-muted">Configuration OK</p>
                        <p className="mb-1">
                            <span className="pr-2 text-mint">$</span>
                            lttx run
                        </p>
                        <div className="mt-4.5 flex items-center gap-2.5 border-t border-[#244f3b] pt-4 text-sm text-mint max-md:mt-3 max-md:pt-3 max-md:text-xs">
                            <span className="inline-block size-2 bg-mint" aria-hidden="true" />
                            <span>http://127.0.0.1:8080</span>
                            <span className="ml-auto" aria-hidden="true">
                                ▌
                            </span>
                        </div>
                    </div>
                </Terminal>
            </div>
        </section>
    );
}
