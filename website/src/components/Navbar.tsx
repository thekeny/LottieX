import { Menu, Star, X } from "lucide-react";
import { useEffect, useState } from "react";
import { navItems } from "../config/content";
import { images } from "../config/images";
import { REPOSITORY, SECTIONS } from "../config/links";
import { useStarCount } from "../hooks/useStarCount";
import { cn } from "../lib/cn";
import { GitHubMark } from "./GitHubMark";

const starFormatter = new Intl.NumberFormat("ru-RU");

const navLinkClassName =
    "inline-flex min-h-11 items-center whitespace-nowrap transition-colors hover:text-mint max-[1050px]:py-4";

export function Navbar() {
    const [open, setOpen] = useState(false);
    const stars = useStarCount(REPOSITORY.apiUrl) ?? REPOSITORY.fallbackStars;

    useEffect(() => {
        if (!open) {
            return;
        }

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setOpen(false);
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [open]);

    const closeMenu = () => setOpen(false);

    return (
        <div className="sticky top-0 z-50 border-b border-line bg-bg">
            <header className="header wrap relative flex min-h-[88px] items-center justify-between gap-[30px] max-[760px]:min-h-[72px] max-[760px]:gap-4">
                <a
                    href={SECTIONS.top.href}
                    aria-label="LottieX — в начало"
                    className="flex min-h-11 min-w-11 items-center justify-center"
                >
                    <img src={images.icon} width={36} height={36} alt="" />
                </a>

                <button
                    type="button"
                    aria-expanded={open}
                    aria-controls="navigation"
                    onClick={() => setOpen((value) => !value)}
                    className="hidden items-center gap-[14px] border-0 bg-transparent px-2 font-mono text-xs text-ink max-[1050px]:ml-auto max-[1050px]:flex max-[1050px]:min-h-11"
                >
                    Меню
                    {open ? <X aria-hidden="true" size={22} /> : <Menu aria-hidden="true" size={22} />}
                </button>

                <nav
                    id="navigation"
                    aria-label="Основная навигация"
                    className={cn(
                        "flex items-center gap-[clamp(12px,1.6vw,24px)] font-mono text-xs text-muted",
                        "max-[1050px]:absolute max-[1050px]:left-0 max-[1050px]:right-0 max-[1050px]:top-[calc(100%-1px)] max-[1050px]:z-[5] max-[1050px]:flex-col max-[1050px]:items-stretch max-[1050px]:gap-0 max-[1050px]:border max-[1050px]:border-line max-[1050px]:bg-panel max-[1050px]:px-5 max-[1050px]:py-3 max-[1050px]:text-[13px]",
                        !open && "max-[1050px]:hidden",
                    )}
                >
                    {navItems.map((item) => (
                        <a key={item.href} href={item.href} onClick={closeMenu} className={navLinkClassName}>
                            {item.label}
                        </a>
                    ))}
                    <a
                        href={REPOSITORY.docsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={closeMenu}
                        className={navLinkClassName}
                    >
                        Документация
                    </a>
                    <a
                        href={REPOSITORY.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`GitHub — репозиторий LottieX, ${starFormatter.format(stars)} звёзд`}
                        onClick={closeMenu}
                        className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-surface px-3 py-2 leading-none text-ink transition hover:bg-card max-[1050px]:my-3 max-[1050px]:justify-center"
                    >
                        <GitHubMark size={16} className="shrink-0" />
                        <span>GitHub</span>
                        <span className="flex items-center gap-1 rounded-md bg-panel px-2 py-0.5 font-mono text-xs leading-none text-mint">
                            <Star aria-hidden="true" size={12} className="shrink-0 fill-current" />
                            <p className="mt-1">{starFormatter.format(stars)}</p>
                        </span>
                    </a>
                </nav>
            </header>
        </div>
    );
}
