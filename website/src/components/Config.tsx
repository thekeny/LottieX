import { useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { hostOptions } from "../config/content";
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
    "min-h-[50px] w-full rounded-none border border-line bg-panel px-4 py-[14px] font-mono text-sm text-ink hover:border-mint";

const labelClassName = "mb-3 flex items-center justify-between gap-3 text-sm";

export function Config() {
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
            className="section wrap pb-[35px] pt-[95px] max-[760px]:pb-[10px] max-[760px]:pt-[65px]"
        >
            <div className="barcode barcode-light max-[760px]:h-[18px]" aria-hidden="true" />

            <div className="mb-12 mt-[65px] grid grid-cols-2 gap-12 max-[1050px]:gap-[30px] max-[760px]:mb-[30px] max-[760px]:mt-[42px] max-[760px]:grid-cols-1 max-[760px]:gap-[26px]">
                <div className="col-start-2 max-[760px]:col-start-1">
                    <h2 className="m-0 text-[clamp(30px,3.6vw,50px)] font-normal leading-[1.06] tracking-[-1.6px] max-[760px]:text-[34px] max-[760px]:tracking-[-1px]">
                        Твоя папка.
                        <br />Твой порт. Твой сервер.
                    </h2>
                    <p className="mt-[23px] max-w-[460px] text-[15px] text-muted max-[760px]:mt-5 max-[760px]:text-sm">
                        Попробуй настройки здесь и скопируй готовый JSON в <code>lottiex.json</code>.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-2 items-start gap-12 max-[1050px]:gap-[30px] max-[760px]:grid-cols-1 max-[760px]:gap-[25px]">
                <form className="pt-[5px]" onSubmit={(event) => event.preventDefault()}>
                    <label htmlFor="root" className={labelClassName}>
                        Папка с сайтом
                    </label>
                    <input
                        id="root"
                        name="root"
                        value={form.root}
                        onChange={handleChange}
                        required
                        maxLength={200}
                        spellCheck={false}
                        className={fieldClassName}
                    />

                    <div className="my-6 grid grid-cols-[1.3fr_1fr] gap-5 max-[760px]:gap-4">
                        <div>
                            <label htmlFor="host" className={labelClassName}>
                                IP-адрес
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
                                Порт
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
                        Индекс директории
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

                    <p role="status" className="min-h-[18px] text-xs text-[#ffb398]">
                        {valid ? "" : "Проверь папку, порт (1–65535) и относительный индекс без .. в пути."}
                    </p>
                </form>

                <Terminal
                    title="lottiex.json"
                    copy={{ text: configCode, message: "JSON скопирован", disabled: !valid, source: codeRef }}
                >
                    <pre className="m-0 whitespace-pre-wrap break-words px-8 py-7 font-mono text-sm leading-[1.8] text-[#c9edbf] max-[760px]:px-6 max-[760px]:py-6 max-[760px]:text-[13px]">
                        <code ref={codeRef}>{configCode}</code>
                    </pre>
                </Terminal>
            </div>
        </section>
    );
}
