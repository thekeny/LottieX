import { useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { startSteps } from "../config/content";
import { images } from "../config/images";
import { SECTIONS } from "../config/links";
import type { StepId } from "../config/types";
import { cn } from "../lib/cn";
import { Terminal } from "./Terminal";

export function Start() {
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
            <div data-reveal className="section-heading md:mt-2.5">
                <div>
                    <h2>
                        От исходников
                        <br />до первого запроса
                    </h2>
                    <p>
                        Нужен curl, make и компилятор с поддержкой C++20
                    </p>
                </div>
            </div>

            <div className="section-columns">
                <div data-reveal className="relative flex min-h-77.5 items-center justify-center border border-line max-lg:min-h-72.5 max-md:min-h-57.5">
                    <img
                        src={images.icon}
                        width={896}
                        height={896}
                        alt="Пиксельная иконка LottieX"
                        loading="lazy"
                        className="size-60 object-contain max-lg:size-55 max-md:size-45"
                    />
                    <span className="absolute -right-px -top-px h-3 w-3 bg-mint" aria-hidden="true" />
                    <span className="absolute -bottom-px -left-px h-3 w-3 bg-mint" aria-hidden="true" />
                </div>

                <div>
                    <div data-reveal role="tablist" aria-label="Шаги запуска" className="mb-6 flex border-b border-line font-mono">
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
                        copy={{ text: step.code, message: "Команда скопирована", source: codeRef }}
                    >
                        <div
                            id="step-panel"
                            role="tabpanel"
                            aria-labelledby={`tab-${step.id}`}
                            tabIndex={0}
                            className="min-h-45 p-6 max-md:min-h-42.5 max-md:p-5.5"
                        >
                            <p className="mb-6 font-mono text-xs leading-relaxed text-muted">{step.comment}</p>
                            <pre className="m-0 whitespace-pre-wrap wrap-anywhere font-mono text-sm leading-loose">
                                <code ref={codeRef}>{step.code}</code>
                            </pre>
                            <p className="mb-0 mt-6 font-mono text-xs leading-relaxed text-mint">{step.result}</p>
                        </div>
                    </Terminal>
                </div>
            </div>
        </section>
    );
}
