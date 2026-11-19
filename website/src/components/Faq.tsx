import { Minus, Plus } from "lucide-react";
import { useState } from "react";
import { useLanguage } from "../config/language";
import { SECTIONS } from "../config/links";
import { cn } from "../lib/cn";

export function Faq() {
    const { copy: { faq } } = useLanguage();
    const [openQuestions, setOpenQuestions] = useState<ReadonlySet<string>>(
        () => new Set(faq.items.slice(0, 1).map((item) => item.id)),
    );

    const toggleQuestion = (id: string) => {
        setOpenQuestions((current) => {
            const next = new Set(current);

            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
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
                        {faq.heading}
                    </h2>
                </div>
            </div>

            <div>
                {faq.items.map((item) => {
                    const open = openQuestions.has(item.id);
                    const buttonId = `faq-question-${item.id}`;
                    const panelId = `faq-answer-${item.id}`;

                    return (
                        <div
                            key={item.id}
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
                                    onClick={() => toggleQuestion(item.id)}
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
