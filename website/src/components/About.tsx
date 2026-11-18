import { ArrowRight, ArrowUpRight } from "lucide-react";
import { features } from "../config/content";
import { SECTIONS } from "../config/links";
import type { FeatureTone, FeatureVisual } from "../config/types";
import { cn } from "../lib/cn";

const cardToneClassName: Record<FeatureTone, string> = {
    default: "bg-surface",
    contrast: "bg-card",
    bright: "bg-mint text-on-mint",
};

const cardTextClassName: Record<FeatureTone, string> = {
    default: "text-card-text",
    contrast: "text-ink",
    bright: "text-card-ink",
};

function FileVisual() {
    return (
        <div className="relative mt-6 flex h-[100px] flex-col items-start gap-1 font-mono text-xs max-[760px]:mt-4 max-[760px]:h-[70px] max-[760px]:w-3/4 max-[760px]:flex-row max-[760px]:flex-wrap max-[760px]:content-center max-[760px]:gap-[5px]">
            {["index.html", "style.css", "script.js"].map((file) => (
                <span
                    key={file}
                    className="w-[120px] border border-[#6f9e78] px-2 py-1 max-[760px]:w-auto max-[760px]:text-[11px]"
                >
                    {file}
                </span>
            ))}
            <ArrowUpRight
                aria-hidden="true"
                size={52}
                className="absolute right-[14px] top-[18px] text-mint max-[760px]:right-[-60px] max-[760px]:top-3"
            />
        </div>
    );
}

function StreamVisual() {
    return (
        <div className="mt-6 flex h-[100px] items-center gap-[7px] max-[760px]:mt-4 max-[760px]:h-[70px] max-[760px]:gap-[9px]">
            {Array.from({ length: 6 }, (_, index) => (
                <span
                    key={index}
                    className={cn("w-[17px] bg-mint max-[760px]:w-[23px]", index % 2 === 1 ? "h-[49px]" : "h-[33px]")}
                />
            ))}
            <b className="ml-auto flex items-center gap-1 font-mono text-xs font-normal">
                64 KiB
                <ArrowRight aria-hidden="true" size={14} />
            </b>
        </div>
    );
}

function PathVisual() {
    return (
        <div className="mt-6 flex h-[100px] flex-col justify-center gap-[10px] font-mono text-xs max-[760px]:mt-4 max-[760px]:h-[70px]">
            <span>./public/</span>
            <span className="flex justify-between">
                <span>└ index.html</span>
                <b className="font-normal">200</b>
            </span>
            <span className="flex justify-between">
                <span>../secret</span>
                <b className="font-normal">404</b>
            </span>
        </div>
    );
}

function FeatureGraphic({ visual }: { visual: FeatureVisual }) {
    if (visual === "files") {
        return <FileVisual />;
    }

    if (visual === "stream") {
        return <StreamVisual />;
    }

    return <PathVisual />;
}

export function About() {
    return (
        <section
            id={SECTIONS.about.id}
            className="section wrap pb-[35px] pt-[95px] max-[760px]:pb-[10px] max-[760px]:pt-[65px]"
        >
            <div className="barcode max-[760px]:h-[18px]" aria-hidden="true" />

            <div className="mb-12 mt-[65px] grid grid-cols-2 gap-12 max-[1050px]:gap-[30px] max-[760px]:mb-[30px] max-[760px]:mt-[42px] max-[760px]:grid-cols-1 max-[760px]:gap-[26px]">
                <div className="col-start-2 max-[760px]:col-start-1">
                    <h2 className="m-0 text-[clamp(30px,3.6vw,50px)] font-normal leading-[1.06] tracking-[-1.6px] max-[760px]:text-[34px] max-[760px]:tracking-[-1px]">
                        Всё для статики.
                        <br />В одном исполняемом файле.
                    </h2>
                    <p className="mt-[23px] max-w-[460px] text-[15px] text-muted max-[760px]:mt-5 max-[760px]:text-sm">
                        Один <code>lttx</code>, один JSON-конфиг и твоя папка с сайтом. Статика, демо с хакатона или
                        несколько HTTP-сервисов за одним адресом.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-4 max-[1050px]:gap-3 max-[760px]:grid-cols-1">
                {features.map((feature) => (
                    <article
                        key={feature.number}
                        className={cn(
                            "flex min-h-[350px] flex-col p-7 transition-transform duration-200 hover:-translate-y-1 max-[1050px]:p-[22px] max-[760px]:min-h-[275px] max-[760px]:p-6",
                            cardToneClassName[feature.tone],
                        )}
                    >
                        <span className="font-mono text-[30px] leading-none tracking-[-3px]">{feature.number}</span>
                        <FeatureGraphic visual={feature.visual} />
                        <h3 className="mb-3 mt-[26px] text-[22px] font-normal leading-[1.15] tracking-[-0.6px] max-[1050px]:text-xl max-[760px]:mt-4 max-[760px]:text-2xl">
                            {feature.title}
                        </h3>
                        <p
                            className={cn(
                                "mb-6 max-w-[310px] text-sm max-[760px]:mb-[10px] max-[760px]:max-w-none",
                                cardTextClassName[feature.tone],
                            )}
                        >
                            {feature.description}
                        </p>
                    </article>
                ))}
            </div>
        </section>
    );
}
