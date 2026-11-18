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
            className="hero wrap flex min-h-[calc(100svh-88px)] flex-col pb-6 pt-8 max-[760px]:min-h-[calc(100svh-72px)] max-[760px]:pb-[22px] max-[760px]:pt-6 min-[1600px]:justify-center"
        >
            <img
                className="hero-logo mb-11 mt-[35px] h-auto w-full max-[760px]:mb-8 max-[760px]:mt-[35px]"
                src={images.logo}
                alt="LottieX"
                width={2752}
                height={640}
                fetchPriority="high"
            />

            <div className="hero-bottom grid grid-cols-[1.15fr_1fr] items-start gap-[9%] max-[1050px]:grid-cols-2 max-[1050px]:gap-9 max-[760px]:grid-cols-1 max-[760px]:gap-[30px]">
                <div>
                    <h1 className="mb-[22px] mt-0 text-[clamp(30px,3.05vw,46px)] font-normal leading-[1.08] tracking-[-1.6px] max-[1050px]:text-[32px] max-[1050px]:tracking-[-1px] max-[760px]:text-[clamp(28px,5.8vw,40px)]">
                        Статический HTTP-сервер
                        <br />
                        для твоего демо
                    </h1>
                    <p className="mb-7 mt-0 text-base text-muted max-[760px]:mb-6 max-[760px]:text-sm">
                        Лендинг, документация или фронтенд с хакатона.
                        <br />
                        Укажи папку — LottieX раздаст файлы по HTTP.
                    </p>
                    <div className="flex flex-wrap items-center gap-[26px] max-[1050px]:gap-5 max-[760px]:gap-5">
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
                    <div className="px-[25px] py-[21px] font-mono text-sm leading-[1.6] max-[760px]:px-5 max-[760px]:py-4 max-[760px]:text-xs">
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
                        <div className="mt-[18px] flex items-center gap-[10px] border-t border-[#244f3b] pt-4 text-[13px] text-mint max-[760px]:mt-3 max-[760px]:pt-3 max-[760px]:text-[11px]">
                            <span className="inline-block h-[7px] w-[7px] bg-mint" aria-hidden="true" />
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
