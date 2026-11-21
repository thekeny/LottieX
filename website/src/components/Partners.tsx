import { images } from "../config/images";
import { useLanguage } from "../config/language";
import { PARTNER_SITES } from "../config/links";

const logos = [
    { id: "cu", style: "w-32 lg:w-40" },
    { id: "hse", style: "w-26 lg:w-30" },
    { id: "tbank", style: "w-24 lg:w-28" },
] as const;

export function Partners() {
    const { copy: { partners } } = useLanguage();

    return (
        <section className="section wrap" aria-labelledby="partners-title">
            <div className="mb-8 text-center md:mb-12">
                <h2
                    id="partners-title"
                    className="mx-auto max-w-3xl text-4xl leading-none tracking-tight md:text-section-heading md:tracking-tighter"
                >
                    {partners.heading}
                </h2>
                <p className="mx-auto mt-5 max-w-xl text-sm text-muted md:text-base">{partners.intro}</p>
            </div>

            <ul role="list" className="grid gap-4 text-center md:grid-cols-3 lg:gap-5">
                {logos.map(({ id, style }) => (
                    <li key={id} className="flex min-w-0 flex-col items-center bg-panel px-5 py-6 md:py-8">
                        <div className="grid h-32 w-full place-items-center lg:h-40">
                            <img
                                src={images.partners[id]}
                                alt=""
                                loading="lazy"
                                decoding="async"
                                className={`${style} [image-rendering:auto]`}
                            />
                        </div>
                        <h3 className="mt-3 grid min-h-12 place-items-center text-base lg:text-lg">
                            {partners[id]}
                        </h3>
                        <a
                            href={PARTNER_SITES[id]}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-1 inline-flex min-h-11 items-center px-2 text-muted transition-colors hover:text-mint"
                        >
                            {partners.more}<span className="sr-only"> — {partners[id]}</span>
                        </a>
                    </li>
                ))}
            </ul>
        </section>
    );
}
