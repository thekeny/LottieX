import { useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { hostOptions } from "../config/content";
import { useLanguage } from "../config/language";
import { SECTIONS } from "../config/links";
import type { ConfigFormState, LottiexConfig } from "../config/types";
import { Terminal } from "./Terminal";

const initialForm: ConfigFormState = {
    root: "./public",
    host: "0.0.0.0",
    port: "8080",
    index: "index.html",
};

const fieldClassName =
    "min-h-12.5 w-full rounded-none border border-line bg-panel px-4 py-3.5 font-mono text-sm text-ink hover:border-mint";

const labelClassName = "mb-3 flex items-center justify-between gap-3 text-sm";

export function Config() {
    const { copy } = useLanguage();
    const [form, setForm] = useState<ConfigFormState>(initialForm);
    const codeRef = useRef<HTMLElement>(null);

    const port = Number(form.port);
    const rootValid = form.root.trim() !== "" && form.root.length <= 200;
    const portValid = Number.isInteger(port) && port >= 1 && port <= 65535;
    const indexValid =
        form.index.trim() !== "" &&
        form.index.length <= 200 &&
        !form.index.startsWith("/") &&
        !form.index.split("/").includes("..");
    const valid = rootValid && portValid && indexValid;

    const config: LottiexConfig = {
        server: { host: form.host, port },
        static: { enabled: true, root: form.root, index: form.index },
    };
    const configCode = JSON.stringify(config, null, 2);

    const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = event.target;
        setForm((current) => ({ ...current, [name]: value }));
    };

    return (
        <section
            id={SECTIONS.config.id}
            className="section wrap"
        >
            <div data-reveal className="barcode barcode-light" aria-hidden="true" />

            <div data-reveal className="section-heading mt-16 max-md:mt-10">
                <div>
                    <h2>
                        {copy.config.heading}
                        <br />{copy.config.subheading}
                    </h2>
                    <p>{copy.config.intro}</p>
                </div>
            </div>

            <div className="section-columns">
                <form data-reveal className="pt-1" onSubmit={(event) => event.preventDefault()}>
                    <label htmlFor="static-root" className={labelClassName}>
                        {copy.config.root}
                    </label>
                    <input
                        id="static-root"
                        name="root"
                        value={form.root}
                        onChange={handleChange}
                        required
                        maxLength={200}
                        spellCheck={false}
                        className={fieldClassName}
                    />

                    <div className="my-6 config-fields grid gap-5 max-md:gap-4">
                        <div>
                            <label htmlFor="host" className={labelClassName}>
                                {copy.config.host}
                            </label>
                            <select id="host" name="host" value={form.host} onChange={handleChange} className={fieldClassName}>
                                {hostOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="port" className={labelClassName}>
                                {copy.config.port}
                            </label>
                            <input
                                id="port"
                                name="port"
                                type="number"
                                min={1}
                                max={65535}
                                value={form.port}
                                onChange={handleChange}
                                required
                                className={fieldClassName}
                            />
                        </div>
                    </div>

                    <label htmlFor="index" className={labelClassName}>
                        {copy.config.index}
                    </label>
                    <input
                        id="index"
                        name="index"
                        value={form.index}
                        onChange={handleChange}
                        required
                        maxLength={200}
                        spellCheck={false}
                        className={fieldClassName}
                    />

                    <p role="status" className="min-h-4.5 text-xs text-[#ffb398]">
                        {valid ? "" : copy.config.invalid}
                    </p>
                </form>

                <Terminal
                    reveal
                    title="lottiex.json"
                    copy={{ text: configCode, message: copy.config.copied, disabled: !valid, source: codeRef }}
                >
                    <pre className="m-0 whitespace-pre-wrap wrap-anywhere px-8 py-7 font-mono text-sm leading-loose text-[#c9edbf] max-md:p-6">
                        <code ref={codeRef}>{configCode}</code>
                    </pre>
                </Terminal>
            </div>
        </section>
    );
}
