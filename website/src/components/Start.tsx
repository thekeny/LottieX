import { useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { images } from "../config/images";
import { useLanguage } from "../config/language";
import { REPOSITORY, SECTIONS } from "../config/links";
import type { StepId } from "../config/types";
import { cn } from "../lib/cn";
import { LinkButton } from "./LinkButton";
import { Terminal } from "./Terminal";

export function Start() {
    const { copy: { start } } = useLanguage();
    const startSteps = start.steps;
    const [activeStep, setActiveStep] = useState<StepId>("install");
    const codeRef = useRef<HTMLElement>(null);

    const step = startSteps.find((item) => item.id === activeStep) ?? startSteps[0];

    const handleTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>, id: StepId) => {
        const position = startSteps.findIndex((item) => item.id === id);
        let nextPosition: number | undefined;

        if (event.key === "ArrowRight") {
            nextPosition = (position + 1) % startSteps.length;
        }
        if (event.key === "ArrowLeft") {
            nextPosition = (position - 1 + startSteps.length) % startSteps.length;
        }
        if (event.key === "Home") {
            nextPosition = 0;
        }
        if (event.key === "End") {
            nextPosition = startSteps.length - 1;
        }
        if (nextPosition === undefined) {
            return;
        }

        event.preventDefault();
        const nextStep = startSteps[nextPosition];
        setActiveStep(nextStep.id);
        document.getElementById(`tab-${nextStep.id}`)?.focus();
    };

    return (
        <section
            id={SECTIONS.start.id}
            className="section wrap"
        >
            <div className="section-columns md:grid-cols-[clamp(13.5rem,29%,20rem)_minmax(0,1fr)] md:grid-rows-[auto_1fr] lg:gap-x-10 lg:gap-y-8">
                <div data-reveal className="section-heading mb-0 block md:col-start-2 md:row-start-1 md:pt-8">
                    <h2>
                        {start.heading}
                        <br />{start.subheading}
                    </h2>
                </div>

                <div data-reveal className="mx-auto flex w-full max-w-72 flex-col gap-3 md:col-start-1 md:row-span-2 md:row-start-1 md:max-w-none">
                    <picture>
                        <source media="(width < 48rem)" srcSet={images.lottie_install_2} />
                        <img
                            src={images.lottie_install}
                            width={496}
                            height={726}
                            alt={start.imageAlt}
                            loading="lazy"
                            className="h-auto w-full"
                        />
                    </picture>
                    <LinkButton
                        variant="secondary"
                        href={REPOSITORY.releasesUrl}
                        external
                        className="min-h-12! gap-2! px-3! py-2! whitespace-nowrap [&>svg]:shrink-0"
                    >
                        {start.releases}
                    </LinkButton>
                </div>

                <div className="min-w-0 md:col-start-2 md:row-start-2">
                    <div data-reveal role="tablist" aria-label={start.stepsLabel} className="mb-4 flex border-b border-line font-mono">
                        {startSteps.map((item) => (
                            <button
                                key={item.id}
                                id={`tab-${item.id}`}
                                type="button"
                                role="tab"
                                aria-selected={item.id === activeStep}
                                aria-controls="step-panel"
                                tabIndex={item.id === activeStep ? 0 : -1}
                                onClick={() => setActiveStep(item.id)}
                                onKeyDown={(event) => handleTabKeyDown(event, item.id)}
                                className={cn(
                                    "flex-1 border-0 border-b-3 bg-transparent px-1 py-4 text-xs transition-colors max-md:min-h-13",
                                    item.id === activeStep
                                        ? "border-mint text-mint"
                                        : "border-transparent text-muted hover:bg-surface",
                                )}
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>

                    <Terminal
                        reveal
                        title="bash"
                        copy={{ text: step.code, message: start.copied, source: codeRef }}
                    >
                        <div
                            id="step-panel"
                            role="tabpanel"
                            aria-labelledby={`tab-${step.id}`}
                            tabIndex={0}
                            className="flex min-h-32 flex-col justify-center gap-2.5 p-4"
                        >
                            <p className="font-mono text-xs leading-relaxed text-muted">{step.comment}</p>
                            <pre className="m-0 whitespace-pre-wrap wrap-anywhere font-mono text-sm leading-normal">
                                <code ref={codeRef}>{step.code}</code>
                            </pre>
                            <p className="font-mono text-xs leading-relaxed text-mint">{step.result}</p>
                        </div>
                    </Terminal>
                </div>
            </div>
        </section>
    );
}
