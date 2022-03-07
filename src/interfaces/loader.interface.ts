import { Arguments, Argv } from 'yargs';

export type EnvProviderResult =
    | Record<string, any>
    | Promise<Record<string, any>>;

export interface EnvProvider<A> {
    key: string;

    builder?: (builder: Argv<any>) => void;

    load: (
        argv: Arguments<A>,
        config?: Record<string, any>
    ) => EnvProviderResult | never;

    pull?: (argv: Arguments<A>, config?: Record<string, any>) => void;

    push?: (argv: Arguments<A>, config?: Record<string, any>) => void;
}

export interface EnvProviderConfig {
    path: string;
    type: 'integrated' | 'module' | 'script';
    handler: EnvProvider<any>;
    config?: Record<string, unknown>;
}
