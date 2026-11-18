import { useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { startSteps } from "../config/content";
import { images } from "../config/images";
import { REPOSITORY, SECTIONS } from "../config/links";
import type { StepId } from "../config/types";
import { cn } from "../lib/cn";
import { LinkButton } from "./LinkButton";
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
            className="section wrap pb-[35px] pt-[95px] max-[760px]:pb-[10px] max-[760px]:pt-[65px]"
        >
            <div className="mb-12 mt-[10px] grid grid-cols-2 gap-12 max-[1050px]:gap-[30px] max-[760px]:mb-[30px] max-[760px]:mt-0 max-[760px]:grid-cols-1 max-[760px]:gap-[26px]">
                <div className="col-start-2 max-[760px]:col-start-1">
                    <h2 className="m-0 text-[clamp(30px,3.6vw,50px)] font-normal leading-[1.06] tracking-[-1.6px] max-[760px]:text-[34px] max-[760px]:tracking-[-1px]">
                        От исходников
                        <br />до первого запроса
                    </h2>
                    <p className="mt-[23px] max-w-[460px] text-[15px] text-muted max-[760px]:mt-5 max-[760px]:text-sm">
                        Нужен curl, make и компилятор с поддержкой C++20
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-2 items-start gap-12 max-[1050px]:gap-[30px] max-[760px]:grid-cols-1 max-[760px]:gap-[25px]">
                <div className="relative flex min-h-[410px] items-center justify-center border border-line max-[1050px]:min-h-[380px] max-[760px]:min-h-[290px]">
                    <img
                        src={images.icon}
                        width={896}
                        height={896}
                        alt="Пиксельная иконка LottieX"
                        loading="lazy"
                        className="h-[330px] w-[330px] object-contain max-[1050px]:h-[280px] max-[1050px]:w-[280px] max-[760px]:h-[245px] max-[760px]:w-[245px]"
                    />
                    <span className="absolute right-[-1px] top-[-1px] h-3 w-3 bg-mint" aria-hidden="true" />
                    <span className="absolute bottom-[-1px] left-[-1px] h-3 w-3 bg-mint" aria-hidden="true" />
                </div>

                <div>
                    <div role="tablist" aria-label="Шаги запуска" className="mb-6 flex border-b border-line font-mono">
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
                                    "flex-1 border-0 border-b-[3px] bg-transparent px-[5px] py-4 text-xs transition-colors max-[760px]:min-h-[52px] max-[760px]:text-[11px]",
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
                        title={`terminal / ${step.id}`}
                        copy={{ text: step.code, message: "Команда скопирована", source: codeRef }}
                    >
                        <div
                            id="step-panel"
                            role="tabpanel"
                            aria-labelledby={`tab-${step.id}`}
                            tabIndex={0}
                            className="min-h-[180px] px-6 py-6 max-[760px]:min-h-[170px] max-[760px]:px-[22px] max-[760px]:py-[22px]"
                        >
                            <p className="mb-6 font-mono text-xs leading-[1.6] text-muted">{step.comment}</p>
                            <pre className="m-0 whitespace-pre-wrap break-words font-mono text-sm leading-[1.8]">
                                <code ref={codeRef}>{step.code}</code>
                            </pre>
                            <p className="mb-0 mt-[25px] font-mono text-xs leading-[1.6] text-mint">{step.result}</p>
                        </div>
                    </Terminal>

                    <p className="my-6 min-h-[42px] text-sm text-muted">{step.description}</p>
                    <LinkButton variant="secondary" href={REPOSITORY.docsUrl} external>
                        Читать документацию
                    </LinkButton>
                </div>
            </div>
        </section>
    );
}
