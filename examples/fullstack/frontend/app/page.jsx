"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "./api-client";

export default function Notes() {
    const router = useRouter();
    const [notes, setNotes] = useState(null);
    const [signedOut, setSignedOut] = useState(false);
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        api("/notes").then(setNotes).catch((failure) => {
            if (failure.status === 401) setSignedOut(true);
            else setError(failure.message);
        });
    }, []);

    async function submit(event) {
        event.preventDefault();
        const data = Object.fromEntries(new FormData(event.currentTarget));
        setBusy(true);
        setError("");

        try {
            if (signedOut) {
                await api("/session", { method: "POST", data });
                setNotes(await api("/notes"));
                setSignedOut(false);
            } else {
                const note = await api("/notes", { method: "POST", data: { ...data, body: "" } });
                router.push(`/notes/${note.id}`);
            }
        } catch (failure) {
            setError(failure.message);
        } finally {
            setBusy(false);
        }
    }

    async function logout() {
        setBusy(true);
        setError("");
        try {
            await api("/session", { method: "DELETE" });
            setNotes(null);
            setSignedOut(true);
        } catch (failure) {
            setError(failure.message);
        } finally {
            setBusy(false);
        }
    }

    return (
        <>
            <h1>{signedOut ? "Sign in" : "Notes"}</h1>
            {error && <p role="alert">{error}</p>}
            {signedOut && (
                <form key="login" onSubmit={submit}>
                    <label>Username <input name="username" autoComplete="username" defaultValue="demo" required /></label>
                    <label>Password <input name="password" type="password" autoComplete="current-password" required /></label>
                    <button disabled={busy}>Sign in</button>
                </form>
            )}
            {notes && (
                <>
                    <form key="create" onSubmit={submit}>
                        <label>New note title <input name="title" maxLength={100} required /></label>
                        <button disabled={busy}>Create note</button>
                    </form>
                    <ul>{notes.map((note) => (
                        <li key={note.id}><Link href={`/notes/${note.id}`}>{note.title}</Link></li>
                    ))}</ul>
                    {notes.length === 0 && <p>No notes yet.</p>}
                    <button type="button" disabled={busy} onClick={logout}>Sign out</button>
                </>
            )}
            {!notes && !signedOut && !error && <p role="status">Loading notes…</p>}
        </>
    );
}
