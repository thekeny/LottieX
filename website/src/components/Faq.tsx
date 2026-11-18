import { Minus, Plus } from "lucide-react";
import { useState } from "react";
import { faqItems } from "../config/content";
import { SECTIONS } from "../config/links";
import { cn } from "../lib/cn";

export function Faq() {
    const [openQuestions, setOpenQuestions] = useState<ReadonlySet<string>>(
        () => new Set(faqItems[0] ? [faqItems[0].question] : []),
    );

    const toggleQuestion = (question: string) => {
        setOpenQuestions((current) => {
            const next = new Set(current);

            if (next.has(question)) {
                next.delete(question);
            } else {
                next.add(question);
            }

            return next;
        });
    };

    return (
        <section
            id={SECTIONS.faq.id}
            className="section wrap pb-[35px] pt-[80px] max-[760px]:pb-[10px] max-[760px]:pt-[65px]"
        >
            <div className="mb-[30px] grid grid-cols-2 gap-12 max-[1050px]:gap-[30px] max-[760px]:grid-cols-1 max-[760px]:gap-[26px]">
                <div className="col-start-2 max-[760px]:col-start-1">
                    <h2 className="m-0 text-[clamp(30px,3.6vw,50px)] font-normal leading-[1.06] tracking-[-1.6px] max-[760px]:text-[34px] max-[760px]:tracking-[-1px]">
                        Вопросы при запуске
                    </h2>
                </div>
            </div>

            <div>
                {faqItems.map((item, index) => {
                    const open = openQuestions.has(item.question);
                    const buttonId = `faq-question-${index}`;
                    const panelId = `faq-answer-${index}`;

                    return (
                        <div
                            key={item.question}
                            className={cn(
                                "mb-[10px] border-l-2 bg-panel transition-colors",
                                open ? "border-mint" : "border-transparent",
                            )}
                        >
                            <h3 className="m-0">
                                <button
                                    id={buttonId}
                                    type="button"
                                    aria-expanded={open}
                                    aria-controls={panelId}
                                    onClick={() => toggleQuestion(item.question)}
                                    className="flex w-full items-center justify-between gap-6 px-[25px] py-[22px] text-left text-base transition-colors hover:bg-surface max-[760px]:gap-[18px] max-[760px]:p-[18px] max-[760px]:text-sm"
                                >
                                    <span>{item.question}</span>
                                    <span className="grid h-[26px] w-[26px] shrink-0 place-items-center bg-mint text-on-mint">
                                        {open ? (
                                            <Minus aria-hidden="true" size={16} />
                                        ) : (
                                            <Plus aria-hidden="true" size={16} />
                                        )}
                                    </span>
                                </button>
                            </h3>
                            <div
                                id={panelId}
                                role="region"
                                aria-labelledby={buttonId}
                                aria-hidden={!open}
                                inert={!open}
                                className={cn(
                                    "grid transition-[grid-template-rows] duration-300 ease-out",
                                    open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                                )}
                            >
                                <div className="overflow-hidden">
                                    <p className="m-0 max-w-[850px] pb-[25px] pl-[25px] pr-20 text-sm text-muted max-[760px]:px-[22px] max-[760px]:pb-[22px] max-[760px]:pl-[18px] max-[760px]:text-[13px]">
                                        {item.answer}
                                    </p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
