"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "../../api-client";

export default function Note({ id }) {
    const router = useRouter();
    const path = `/notes/${encodeURIComponent(id)}`;
    const [note, setNote] = useState(null);
    const [error, setError] = useState("");
    const [status, setStatus] = useState("");
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        api(path).then(setNote).catch((failure) => setError(failure.message));
    }, [path]);

    async function change(event, action) {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        setBusy(true);
        setStatus("");
        setError("");

        try {
            if (action === "upload") {
                const attachment = await api(`${path}/attachment`, { method: "PUT", data });
                setNote({ ...note, ...attachment });
                setStatus("Attachment uploaded.");
            } else if (action === "delete") {
                await api(path, { method: "DELETE" });
                router.push("/");
            } else {
                setNote(await api(path, { method: "PUT", data: Object.fromEntries(data) }));
                setStatus("Note saved.");
            }
        } catch (failure) {
            setError(failure.message);
        } finally {
            setBusy(false);
        }
    }

    return (
        <>
            <Link href="/">All notes</Link>
            <h1>{note?.title ?? "Note"}</h1>
            {error && <p role="alert">{error}</p>}
            {status && <p role="status">{status}</p>}
            {!note && !error && <p role="status">Loading note…</p>}
            {note && (
                <>
                    <form onSubmit={(event) => change(event, "save")}>
                        <label>Title <input name="title" defaultValue={note.title} maxLength={100} required /></label>
                        <label>Text <textarea name="body" defaultValue={note.body} maxLength={10000} rows={6} /></label>
                        <button disabled={busy}>Save note</button>
                    </form>
                    <section aria-labelledby="attachment">
                        <h2 id="attachment">Attachment</h2>
                        {note.filename && <a href={`/api${path}/attachment`}>{note.filename}</a>}
                        <form onSubmit={(event) => change(event, "upload")}>
                            <label>File (up to 1 MiB) <input type="file" name="file" required /></label>
                            <button disabled={busy}>Upload attachment</button>
                        </form>
                    </section>
                    <form onSubmit={(event) => change(event, "delete")}>
                        <button className="delete" disabled={busy}>Delete note</button>
                    </form>
                </>
            )}
        </>
    );
}
