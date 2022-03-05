import { Arguments, Argv } from 'yargs';

export type EnvMiddlewareResult =
    | Record<string, any>
    | Promise<Record<string, any>>;

export interface EnvMiddleware<A> {
    init?: (builder: Argv<any>) => void;

    loadEnv: (
        argv: Arguments<A>,
        config?: Record<string, any>
    ) => EnvMiddlewareResult | never;

    loadSecrets?: (
        argv: Arguments<A>,
        config?: Record<string, any>
    ) => EnvMiddlewareResult | never;
}

export interface EnvConfigMiddleware {
    key: string;

    loader: EnvMiddleware<any>;

    config?: Record<string, unknown>;
}
