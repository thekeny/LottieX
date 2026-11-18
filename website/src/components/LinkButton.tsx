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
                "inline-flex min-h-13.5 items-center justify-between gap-9 px-5.5 py-4.5 text-sm font-bold text-[#14261c] transition hover:-translate-y-0.5 active:translate-y-px max-md:min-h-12 max-md:gap-6 max-md:px-4.5 max-md:py-3.5",
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
