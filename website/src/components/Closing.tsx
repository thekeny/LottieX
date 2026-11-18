import { SECTIONS } from "../config/links";
import { LinkButton } from "./LinkButton";

export function Closing() {
    return (
        <section className="closing wrap pt-[95px] max-[760px]:pt-[65px]" aria-labelledby="closing-title">
            <div className="barcode max-[760px]:h-[18px]" aria-hidden="true" />

            <div className="relative pb-[70px] pt-16 max-[760px]:pb-[50px] max-[760px]:pt-[42px]">
                <h2
                    id="closing-title"
                    className="mb-[35px] mt-8 text-[clamp(42px,6.6vw,92px)] font-normal leading-[0.99] tracking-[-3px] max-[760px]:mt-7 max-[760px]:text-[clamp(39px,9.4vw,65px)] max-[760px]:tracking-[-1.5px]"
                >
                    Пора показать,
                    <br />
                    что ты собрал<span className="text-mint">.</span>
                </h2>
                <LinkButton href={SECTIONS.start.href}>Запустить LottieX</LinkButton>
            </div>
        </section>
    );
}
