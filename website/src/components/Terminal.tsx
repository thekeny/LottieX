import type { ReactNode, RefObject } from "react";
import { cn } from "../lib/cn";
import { CopyButton } from "./CopyButton";

type TerminalCopy = {
    text: string;
    message: string;
    disabled?: boolean;
    source?: RefObject<HTMLElement | null>;
};

type TerminalProps = {
    title: string;
    children: ReactNode;
    copy?: TerminalCopy;
    className?: string;
    reveal?: boolean;
};

export function Terminal({ title, children, copy, className, reveal }: TerminalProps) {
    return (
        <div data-reveal={reveal ? "" : undefined} className={cn("border border-line bg-panel", className)}>
            <div className="flex min-h-10 items-center justify-between gap-2.5 bg-mint px-4 py-3 font-mono text-xs text-[#12351f]">
                <span>{title}</span>
                {copy ? <CopyButton {...copy} /> : <span aria-hidden="true">▪ ▪ ▪</span>}
            </div>
            {children}
        </div>
    );
}
