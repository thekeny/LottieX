import { useLayoutEffect } from "react";

export function useIntroAnimation(): void {
    useLayoutEffect(() => {
        const root = document.documentElement;
        const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        if (reducedMotion) {
            delete root.dataset.intro;
            return;
        }

        root.dataset.intro = "pending";

        const logo = document.querySelector<HTMLImageElement>(".hero-logo");
        if (!logo) {
            root.dataset.intro = "ready";
            return;
        }

        logo.decode()
            .catch(() => {})
            .finally(() => {
                root.dataset.intro = "ready";
            });

        return () => {
            delete root.dataset.intro;
        };
    }, []);
}
