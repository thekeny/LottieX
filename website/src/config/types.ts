import type { ReactNode } from "react";

export type SectionLink = {
    id: string;
    href: string;
};

export type NavItem = {
    label: string;
    href: string;
};

export type StepId = "install" | "run" | "request";

export type StartStep = {
    id: StepId;
    label: string;
    comment: string;
    code: string;
    result: string;
};

export type HostOption = {
    label: string;
    value: string;
};

export type FaqItem = {
    id: string;
    question: string;
    answer: ReactNode;
};

export type LottiexConfig = {
    server: {
        host: string;
        port: number;
    };
    static: {
        enabled: boolean;
        root: string;
        index: string;
    };
};

export type ConfigFormState = {
    root: string;
    host: string;
    port: string;
    index: string;
};
