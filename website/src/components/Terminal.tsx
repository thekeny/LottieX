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
};

export function Terminal({ title, children, copy, className }: TerminalProps) {
    return (
        <div className={cn("border border-line bg-panel", className)}>
            <div className="flex min-h-10 items-center justify-between gap-[10px] bg-mint px-4 py-[11px] font-mono text-xs text-[#12351f]">
                <span>{title}</span>
                {copy ? <CopyButton {...copy} /> : <span aria-hidden="true">▪ ▪ ▪</span>}
            </div>
            {children}
        </div>
    );
}
