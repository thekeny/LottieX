import { REPOSITORY } from "../config/links";
import { LinkButton } from "./LinkButton";

export function Closing() {
    return (
        <section className="closing wrap pt-16 md:pt-24" aria-labelledby="closing-title">
            <div data-reveal className="barcode" aria-hidden="true" />

            <div data-reveal className="relative pb-17.5 pt-16 max-md:pb-12.5 max-md:pt-10.5">
                <h2
                    id="closing-title"
                    className="mb-9 mt-8 text-closing-heading leading-none tracking-tighter max-md:mt-7 max-md:text-closing-mobile max-md:tracking-tight"
                >
                    Пора показать,
                    <br />
                    что ты собрал<span className="text-mint">.</span>
                </h2>
                <LinkButton href={REPOSITORY.docsUrl} external>
                    Запустить LottieX
                </LinkButton>
            </div>
        </section>
    );
}
