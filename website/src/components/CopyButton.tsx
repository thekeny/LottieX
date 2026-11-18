import { Copy } from "lucide-react";
import type { RefObject } from "react";
import { useToast } from "../context/toast";
import { copyText } from "../lib/clipboard";

export type CopyButtonProps = {
    text: string;
    message: string;
    disabled?: boolean;
    source?: RefObject<HTMLElement | null>;
};

export function CopyButton({ text, message, disabled = false, source }: CopyButtonProps) {
    const { showToast } = useToast();

    const handleCopy = async () => {
        const result = await copyText(text, source?.current ?? null);

        if (result === "copied") {
            showToast(message);
            return;
        }

        showToast(
            result === "selected" ? "Текст выделен. Нажми Ctrl+C для копирования." : "Не удалось скопировать текст.",
        );
    };

    return (
        <button
            type="button"
            onClick={handleCopy}
            disabled={disabled}
            className="inline-flex min-h-[25px] items-center gap-1.5 border-0 bg-transparent px-0 py-[3px] font-mono text-[11px] text-current hover:underline hover:underline-offset-4 disabled:cursor-not-allowed disabled:opacity-40"
        >
            Копировать
            <Copy aria-hidden="true" size={13} />
        </button>
    );
}
