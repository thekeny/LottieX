export async function api(path, { method = "GET", data } = {}) {
    const multipart = data instanceof FormData;
    const response = await fetch(`/api${path}`, {
        method,
        headers: data && !multipart ? { "Content-Type": "application/json" } : {},
        body: multipart ? data : JSON.stringify(data),
        cache: "no-store"
    });

    if (!response.ok) {
        const { detail } = await response.json().catch(() => ({}));
        const error = new Error(typeof detail === "string" ? detail : `Request failed (${response.status})`);
        error.status = response.status;
        throw error;
    }

    return response.status === 204 ? null : response.json();
}
