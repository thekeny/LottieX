import { Copy } from "lucide-react";
import type { RefObject } from "react";
import { toast } from "react-hot-toast";
import { useLanguage } from "../config/language";
import { copyText } from "../lib/clipboard";

export type CopyButtonProps = {
    text: string;
    message: string;
    disabled?: boolean;
    source?: RefObject<HTMLElement | null>;
};

export function CopyButton({ text, message, disabled = false, source }: CopyButtonProps) {
    const { copy } = useLanguage();

    const handleCopy = async () => {
        const result = await copyText(text, source?.current ?? null);

        if (result === "copied") {
            toast(message);
            return;
        }

        toast(result === "selected" ? copy.copy.selected : copy.copy.failed);
    };

    return (
        <button
            type="button"
            onClick={handleCopy}
            disabled={disabled}
            className="inline-flex min-h-6 items-center gap-1.5 border-0 bg-transparent px-1.5 -mx-1.5 py-1 font-mono text-xs text-current transition-colors hover:bg-black/10 disabled:cursor-not-allowed disabled:opacity-40"
        >
            {copy.copy.button}
            <Copy aria-hidden="true" size={13} />
        </button>
    );
}
