import { useLayoutEffect } from "react";

export function useScrollReveal(): void {
    useLayoutEffect(() => {
        if (!("IntersectionObserver" in window) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            return;
        }

        const targets = document.querySelectorAll<HTMLElement>("[data-reveal]");
        const observer = new IntersectionObserver((entries) => {
            for (const { target, isIntersecting } of entries) {
                if (isIntersecting && target.getAttribute("data-reveal") === "pending") {
                    target.setAttribute("data-reveal", "shown");
                    observer.unobserve(target);
                }
            }
        }, { rootMargin: "0px 0px -16px" });

        const revealOnFocus = (event: FocusEvent) => {
            if (!(event.target instanceof Element)) {
                return;
            }

            const target = event.target.closest('[data-reveal="pending"], [data-reveal="shown"]');
            if (target) {
                target.setAttribute("data-reveal", "");
                observer.unobserve(target);
            }
        };

        for (const target of targets) {
            target.dataset.reveal = "pending";
            observer.observe(target);
        }

        document.addEventListener("focusin", revealOnFocus);

        return () => {
            observer.disconnect();
            document.removeEventListener("focusin", revealOnFocus);

            for (const target of targets) {
                target.dataset.reveal = "";
            }
        };
    }, []);
}
