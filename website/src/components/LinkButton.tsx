import { ArrowUpRight } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "../lib/cn";

type LinkButtonProps = {
    href: string;
    children: ReactNode;
    variant?: "primary" | "secondary";
    external?: boolean;
    className?: string;
};

export function LinkButton({ href, children, variant = "primary", external = false, className }: LinkButtonProps) {
    return (
        <a
            href={href}
            className={cn(
                "inline-flex min-h-[54px] items-center justify-between gap-[35px] px-[22px] py-[18px] text-sm font-bold text-[#14261c] transition hover:-translate-y-[2px] active:translate-y-[1px] max-[760px]:min-h-[48px] max-[760px]:gap-[25px] max-[760px]:px-[18px] max-[760px]:py-[14px] max-[760px]:text-[13px]",
                variant === "primary" ? "bg-accent hover:bg-[#ff9c7d]" : "bg-mint hover:bg-ink",
                className,
            )}
            {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        >
            <span>{children}</span>
            <ArrowUpRight aria-hidden="true" size={21} />
        </a>
    );
}
