import { Arguments, Argv } from 'yargs';

export type EnvResult = Record<string, any> | Promise<Record<string, any>>;

export interface EnvProviderResult {
    key: string;
    config?: Record<string, unknown>;
    result: Record<string, any>;
}

export interface EnvProvider<A, C extends Record<string, any>> {
    key: string;

    builder?: (builder: Argv<any>) => void;

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
