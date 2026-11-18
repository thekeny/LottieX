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
            className="section wrap md:pt-20"
        >
            <div data-reveal className="section-heading mb-8">
                <div>
                    <h2>
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
                            data-reveal
                            className={cn(
                                "mb-2.5 border-l-2 bg-panel transition-colors",
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
                                    className="flex w-full items-center justify-between gap-6 px-6 py-5.5 text-left text-base transition-colors hover:bg-surface max-md:gap-4.5 max-md:p-4.5 max-md:text-sm"
                                >
                                    <span>{item.question}</span>
                                    <span className="grid size-6.5 shrink-0 place-items-center bg-mint text-on-mint">
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
                                className="faq-answer"
                            >
                                <div className="overflow-hidden">
                                    <p className="m-0 max-w-4xl pb-6 pl-6 pr-20 text-sm text-muted max-md:pb-5.5 max-md:pl-4.5 max-md:pr-5.5">
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
