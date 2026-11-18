import { ArrowRight, ArrowUpRight } from "lucide-react";
import { SECTIONS } from "../config/links";

export function About() {
    const features = [
        {
            number: "01",
            tone: "default",
            title: "Отдаёт твой фронтенд",
            description: "HTML, CSS, JavaScript и изображения. GET, HEAD, MIME-типы и индексы директорий уже предусмотрены.",
            graphic: (
                <div className="relative flex h-full flex-col items-start gap-1 font-mono text-xs max-md:w-3/4 max-md:flex-row max-md:flex-wrap max-md:content-center">
                    {["index.html", "style.css", "script.js"].map((file) => (
                        <span key={file} className="w-30 border border-file px-2 py-1 max-md:w-auto">
                            {file}
                        </span>
                    ))}
                    <ArrowUpRight
                        aria-hidden="true"
                        size={52}
                        className="absolute right-3.5 top-4.5 text-mint max-md:-right-15 max-md:top-3"
                    />
                </div>
            ),
        },
        {
            number: "02",
            tone: "contrast",
            title: "Передаёт файлы блоками",
            description: "Потоковая отправка без загрузки целого файла в строку. До 64 КиБ за один блок.",
            graphic: (
                <div className="flex h-full items-center gap-2">
                    {Array.from({ length: 6 }, (_, index) => (
                        <span key={index} className="w-4.5 bg-mint odd:h-8 even:h-12 max-md:w-6" />
                    ))}
                    <span className="ml-auto flex items-center gap-1 font-mono text-xs">
                        64 KiB
                        <ArrowRight aria-hidden="true" size={14} />
                    </span>
                </div>
            ),
        },
        {
            number: "03",
            tone: "bright",
            title: "Проверяет пути",
            description: "Выход за корневую папку и ведущие наружу симлинки получают ответ 404.",
            graphic: (
                <div className="flex h-full flex-col justify-center gap-2.5 font-mono text-xs">
                    <span>./public/</span>
                    <span className="flex justify-between">
                        <span>└ index.html</span>
                        <span>200</span>
                    </span>
                    <span className="flex justify-between">
                        <span>../secret</span>
                        <span>404</span>
                    </span>
                </div>
            ),
        },
    ];

    return (
        <section id={SECTIONS.about.id} className="section wrap">
            <div data-reveal className="barcode" aria-hidden="true" />

            <div data-reveal className="section-heading mt-16 max-md:mt-10">
                <div>
                    <h2>
                        Всё для статики.
                        <br />В одном исполняемом файле.
                    </h2>
                    <p>
                        Один <code>lttx</code>, один JSON-конфиг и твоя папка с сайтом. Статика, демо с хакатона или
                        несколько HTTP-сервисов за одним адресом.
                    </p>
                </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3 lg:gap-4">
                {features.map(({ number, tone, title, description, graphic }) => (
                    <article
                        key={number}
                        data-tone={tone}
                        data-reveal
                        className="feature-card flex min-h-69 flex-col p-6 transition-transform duration-200 hover:-translate-y-1 md:min-h-88 md:p-5.5 lg:p-7"
                    >
                        <span className="font-mono text-3xl leading-none tracking-tighter">{number}</span>
                        <div className="mt-4 h-18 md:mt-6 md:h-25">{graphic}</div>
                        <h3 className="mb-3 mt-4 text-2xl leading-tight tracking-tight md:mt-6 md:text-xl lg:text-2xl">
                            {title}
                        </h3>
                        <p className="feature-description mb-2.5 text-sm md:mb-6 md:max-w-xs">{description}</p>
                    </article>
                ))}
            </div>
        </section>
    );
}
