import { useLayoutEffect } from "react";

export function useIntroAnimation(): void {
    useLayoutEffect(() => {
        const logo = document.querySelector<HTMLImageElement>(".hero-logo");
        if (!logo || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            return;
        }

        const root = document.documentElement;
        let active = true;
        root.dataset.intro = "pending";

        const start = () => {
            if (active) {
                root.dataset.intro = "ready";
            }
        };

        void logo.decode().then(start, start);

        return () => {
            active = false;
            delete root.dataset.intro;
        };
    }, []);
}
