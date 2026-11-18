import { images } from "../config/images";
import { SECTIONS } from "../config/links";

export function Footer() {
    return (
        <>
            <footer data-reveal className="wrap flex flex-wrap items-center justify-between gap-x-7.5 gap-y-4 border-t border-line py-7.5 pb-11 max-md:py-6">
                <div className="flex flex-col gap-1">
                    <a href={SECTIONS.top.href} aria-label="LottieX — в начало">
                        <img
                            src={images.logo}
                            alt="LottieX"
                            width={172}
                            height={40}
                            loading="lazy"
                            className="h-10 w-auto object-contain max-md:h-7.5"
                        />
                    </a>
                </div>

                <span className="font-mono text-xs leading-loose text-muted">© 2026 Kenyka • Код под лицензией MIT</span>

                <p className="basis-full text-sm text-muted">
                    LottieX — независимый проект, созданный без участия организаторов{" "}
                    <a href="https://prodcontest.com/" className="underline underline-offset-2 hover:text-mint">
                        олимпиады PROD
                    </a>
                    . Образ её маскота Лотти послужил визуальным референсом.
                </p>
            </footer>

            <img src={images.lottie_spin} alt="Lottie spin" className="mx-auto mt-120 size-100" />
        </>
    );
}
