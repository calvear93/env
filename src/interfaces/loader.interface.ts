import { Arguments, Argv } from 'yargs';

export type EnvLoaderResult =
    | Record<string, any>
    | Promise<Record<string, any>>;

export interface EnvLoader<A> {
    builder?: (builder: Argv<any>) => void;

    load: (
        argv: Arguments<A>,
        config?: Record<string, any>
    ) => EnvLoaderResult | never;

    pull?: (argv: Arguments<A>, config?: Record<string, any>) => void;

    push?: (argv: Arguments<A>, config?: Record<string, any>) => void;
}

export interface EnvLoaderConfig {
    key: string;

    provider: EnvLoader<any>;

    config?: Record<string, unknown>;
}
