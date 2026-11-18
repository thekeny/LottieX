const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const { randomUUID } = require("node:crypto");
const { readFile } = require("node:fs/promises");
const { chromium } = require("playwright");

const origin = new URL(process.env.DEMO_URL || "http://127.0.0.1:8080").origin;
const password = process.env.DEMO_PASSWORD;
const secure = origin.startsWith("https:");
const title = `Test note ${randomUUID()}`;
const attachment = Buffer.from([0, 1, 2, 255]);

async function main() {
    assert(password, "Set DEMO_PASSWORD for the demo instance");
    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();
    page.setDefaultTimeout(10000);
    let notePath;

    try {
        assert.equal((await context.request.get(`${origin}/api/notes`)).status(), 401);
        await page.goto(origin);
        await page.getByLabel("Password").fill(password);
        await page.getByRole("button", { name: "Sign in" }).click();
        await page.getByRole("heading", { name: "Notes", exact: true }).waitFor();

        const session = (await context.cookies(origin)).find((cookie) => cookie.name === "lottiex_demo");
        assert(session?.httpOnly);
        assert.equal(session.sameSite, "Lax");
        assert.equal(session.secure, secure);

        await page.getByLabel("New note title").fill(title);
        await page.getByRole("button", { name: "Create note" }).click();
        await page.waitForURL(/\/notes\/\d+$/);
        const noteUrl = page.url();
        notePath = `/api${new URL(noteUrl).pathname}`;

        await page.getByLabel("Text").fill("Stored behind LottieX");
        await page.getByRole("button", { name: "Save note" }).click();
        await page.getByText("Note saved.", { exact: true }).waitFor();
        await page.getByLabel("File (up to 1 MiB)").setInputFiles({
            name: "sample.bin",
            mimeType: "application/octet-stream",
            buffer: attachment
        });
        await page.getByRole("button", { name: "Upload attachment" }).click();
        await page.getByText("Attachment uploaded.", { exact: true }).waitFor();

        if (process.argv.includes("--compose-restart")) {
            const options = secure ? ["--https"] : [];
            const demo = `${__dirname}/../examples/fullstack/demo`;
            execFileSync(demo, [...options, "down"], { stdio: "inherit", timeout: 120000 });
            execFileSync(demo, [...options, "up"], { stdio: "inherit", timeout: 300000 });
        }

        await page.getByRole("link", { name: "All notes" }).click();
        await page.getByRole("link", { name: title }).click();
        await page.waitForURL(noteUrl);
        await page.reload();
        await page.getByRole("heading", { name: title }).waitFor();
        assert.equal(await page.getByLabel("Text").inputValue(), "Stored behind LottieX");

        const downloadPromise = page.waitForEvent("download");
        await page.getByRole("link", { name: "sample.bin" }).click();
        const download = await downloadPromise;
        assert.equal(download.suggestedFilename(), "sample.bin");
        assert.deepEqual(await readFile(await download.path()), attachment);

        await page.getByRole("button", { name: "Delete note" }).click();
        await page.waitForURL(`${origin}/`);
        assert.equal((await context.request.get(`${origin}${notePath}`)).status(), 404);
        notePath = undefined;

        await page.getByRole("button", { name: "Sign out" }).click();
        await page.getByRole("heading", { name: "Sign in" }).waitFor();
        const oldSession = await fetch(`${origin}/api/notes`, {
            headers: { Cookie: `${session.name}=${session.value}` }
        });
        assert.equal(oldSession.status, 401);
        console.log("Fullstack browser checks passed");
    } finally {
        try {
            if (notePath) {
                await context.request.delete(`${origin}${notePath}`, {
                    headers: { Origin: origin },
                    timeout: 5000
                }).catch(() => {});
            }
        } finally {
            await browser.close();
        }
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
