import { images } from "../config/images";
import { SECTIONS } from "../config/links";

export function Footer() {
    return (
        <footer className="footer wrap flex items-center justify-between gap-[30px] border-t border-line py-[30px] pb-[45px] max-[760px]:flex-wrap max-[760px]:gap-[22px] max-[760px]:py-[25px]">
            <div className="flex flex-col gap-1">
                <a href={SECTIONS.top.href} aria-label="LottieX — в начало">
                    <img
                        src={images.logo}
                        alt="LottieX"
                        width={172}
                        height={40}
                        loading="lazy"
                        className="h-10 w-[172px] object-contain max-[760px]:h-[30px] max-[760px]:w-[129px]"
                    />
                </a>
            </div>

            <span className="font-mono text-[10px] leading-[2] text-muted max-[760px]:order-2">© 2026 Kenyka • MIT Licensed</span>
        </footer>
    );
}
