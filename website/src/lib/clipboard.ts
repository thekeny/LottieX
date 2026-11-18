export type CopyResult = "copied" | "selected" | "failed";

export async function copyText(text: string, source?: HTMLElement | null): Promise<CopyResult> {
    try {
        await navigator.clipboard.writeText(text);
        return "copied";
    } catch {
        if (!source) {
            return "failed";
        }

        const selection = window.getSelection();
        if (!selection) {
            return "failed";
        }

        const range = document.createRange();
        range.selectNodeContents(source);
        selection.removeAllRanges();
        selection.addRange(range);
        return "selected";
    }
}
