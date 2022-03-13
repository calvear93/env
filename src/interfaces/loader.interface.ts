import { Arguments, Argv } from 'yargs';

export type EnvResult =
    | Record<string, unknown>
    | Record<string, unknown>[]
    | Promise<Record<string, unknown>>
    | Promise<Record<string, unknown>[]>;

export interface EnvProviderResult {
    key: string;
    config?: Record<string, unknown>;
    value: Record<string, any> | Record<string, any>[];
}

export interface EnvProvider<
    A,
    C extends Record<string, any> | undefined = undefined
> {
    key: string;

    builder?: (builder: Argv<unknown>) => void;

    load: (argv: Arguments<A>, config?: C) => EnvResult | never;

    pull?: (argv: Arguments<A>, config?: Record<string, any>) => void;

    push?: (argv: Arguments<A>, config?: Record<string, any>) => void;
}

export interface EnvProviderConfig {
    path: string;
    type: 'integrated' | 'module' | 'script';
    handler: EnvProvider<any, any>;
    config?: Record<string, unknown>;
}
