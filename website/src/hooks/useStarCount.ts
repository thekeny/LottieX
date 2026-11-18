import { useEffect, useState } from "react";

const STORAGE_KEY = "lottiex:stars";
const CACHE_TTL_MS = 10 * 60 * 1000;

type CachedStars = {
    count: number;
    timestamp: number;
};

function readCachedStars(): CachedStars | null {
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) {
            return null;
        }

        const cached = JSON.parse(raw) as Partial<CachedStars>;
        if (typeof cached.count !== "number" || typeof cached.timestamp !== "number") {
            return null;
        }

        return { count: cached.count, timestamp: cached.timestamp };
    } catch {
        return null;
    }
}

function writeCachedStars(count: number): void {
    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ count, timestamp: Date.now() }));
    } catch {
        // Storage may be unavailable; the live value still renders.
    }
}

export function useStarCount(apiUrl: string): number | null {
    const [count, setCount] = useState<number | null>(() => readCachedStars()?.count ?? null);

    useEffect(() => {
        const cached = readCachedStars();
        if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
            return;
        }

        const controller = new AbortController();

        fetch(apiUrl, {
            signal: controller.signal,
            headers: { Accept: "application/vnd.github+json" },
        })
            .then((response) => (response.ok ? response.json() : null))
            .then((data: { stargazers_count?: number } | null) => {
                if (data && typeof data.stargazers_count === "number") {
                    setCount(data.stargazers_count);
                    writeCachedStars(data.stargazers_count);
                }
            })
            .catch(() => {});

        return () => controller.abort();
    }, [apiUrl]);

    return count;
}
