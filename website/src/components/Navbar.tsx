import { Menu, Star, X } from "lucide-react";
import { useEffect, useState } from "react";
import { navItems } from "../config/content";
import { images } from "../config/images";
import { REPOSITORY, SECTIONS } from "../config/links";
import { useStarCount } from "../hooks/useStarCount";
import { cn } from "../lib/cn";

const starFormatter = new Intl.NumberFormat("ru-RU");

const navLinkClassName =
    "inline-flex min-h-11 items-center whitespace-nowrap transition-colors hover:text-mint max-lg:py-4";

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
            <header className="header wrap relative flex items-center justify-between gap-8 max-md:gap-4">
                <a
                    href={SECTIONS.top.href}
                    aria-label="LottieX — в начало"
                    className="flex min-h-11 min-w-11 items-center justify-center"
                >
                    <img src={images.icon} width={60} height={60} alt="" />
                </a>

                <button
                    type="button"
                    aria-label="Меню"
                    aria-expanded={open}
                    aria-controls="navigation"
                    onClick={() => setOpen((value) => !value)}
                    className="hidden items-center gap-3.5 border-0 bg-transparent px-2 font-mono text-xs text-ink max-lg:ml-auto max-lg:flex max-lg:min-h-11"
                >
                    {open ? <X aria-hidden="true" size={22} /> : <Menu aria-hidden="true" size={22} />}
                </button>

                <nav
                    id="navigation"
                    aria-label="Основная навигация"
                    className={cn(
                        "flex items-center gap-4 xl:gap-5 2xl:gap-6 font-mono text-xs text-muted",
                        "max-lg:absolute max-lg:inset-x-0 max-lg:top-full max-lg:z-5 max-lg:-mt-px max-lg:flex-col max-lg:items-stretch max-lg:gap-0 max-lg:border max-lg:border-line max-lg:bg-panel max-lg:px-5 max-lg:py-3 max-lg:text-sm max-lg:transition-[opacity,transform,visibility] max-lg:duration-200 max-lg:ease-out",
                        open
                            ? "max-lg:visible max-lg:translate-y-0 max-lg:opacity-100"
                            : "max-lg:pointer-events-none max-lg:invisible max-lg:-translate-y-1.5 max-lg:opacity-0",
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
                        className="flex min-h-11 items-center gap-2 rounded-lg bg-surface px-3 py-2 leading-none text-ink transition hover:bg-card max-lg:my-3 max-lg:justify-center"
                    >
                        <img src={images.github} alt="" className="w-4 h-4"/>
                        <span className="mt-0.5">GitHub</span>
                        <span className="flex items-center gap-1 rounded-md bg-panel px-2 py-0.5 font-mono text-xs leading-none text-mint">
                            <Star aria-hidden="true" size={12} className="shrink-0 fill-current" />
                            <p className="mt-0.5">{starFormatter.format(stars)}</p>
                        </span>
                    </a>
                </nav>
            </header>
        </div>
    );
}
