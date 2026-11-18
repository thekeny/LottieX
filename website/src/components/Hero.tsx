import { useRef } from "react";
import { images } from "../config/images";
import { INSTALL_COMMAND, REPOSITORY, SECTIONS } from "../config/links";
import { LinkButton } from "./LinkButton";
import { Terminal } from "./Terminal";

export function Hero() {
    const installRef = useRef<HTMLElement>(null);

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
                    <h1 className="mb-5.5 mt-0 text-hero-heading leading-none tracking-tighter max-lg:text-3xl max-lg:tracking-tight max-md:text-hero-mobile">
                        Статический HTTP-сервер
                        <br />
                        для твоего демо
                    </h1>
                    <p className="mb-7 mt-0 text-base text-muted max-md:mb-6 max-md:text-sm">
                        Лендинг, документация или фронтенд с хакатона.
                        <br />
                        Укажи папку — LottieX раздаст файлы по HTTP.
                    </p>
                    <div className="flex flex-wrap items-center gap-6.5 max-lg:gap-5">
                        <LinkButton href={SECTIONS.start.href}>Запустить LottieX</LinkButton>
                        <LinkButton variant="secondary" href={REPOSITORY.docsUrl} external>
                            Читать документацию
                        </LinkButton>
                    </div>
                </div>

                <Terminal
                    title="~/lottiex"
                    copy={{ text: INSTALL_COMMAND, message: "Команда установки скопирована", source: installRef }}
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
