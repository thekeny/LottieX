import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { ToastContext } from "../context/toast";
import { cn } from "../lib/cn";

type ToastProviderProps = {
    children: ReactNode;
};

export function ToastProvider({ children }: ToastProviderProps) {
    const [message, setMessage] = useState("");
    const [visible, setVisible] = useState(false);
    const timer = useRef<number | undefined>(undefined);

    const showToast = useCallback((nextMessage: string) => {
        setMessage(nextMessage);
        setVisible(true);
        window.clearTimeout(timer.current);
        timer.current = window.setTimeout(() => setVisible(false), 2500);
    }, []);

    useEffect(() => {
        return () => window.clearTimeout(timer.current);
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div
                role="status"
                aria-live="polite"
                className={cn(
                    "pointer-events-none fixed bottom-6 right-6 z-20 bg-mint px-5 py-[14px] font-mono text-[13px] text-[#143722] transition duration-200 max-[760px]:left-5 max-[760px]:right-5 max-[760px]:text-center",
                    visible ? "translate-y-0 opacity-100" : "translate-y-[100px] opacity-0",
                )}
            >
                {message}
            </div>
        </ToastContext.Provider>
    );
}
