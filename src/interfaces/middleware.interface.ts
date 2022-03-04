import { Arguments, Argv } from 'yargs';

export interface EnvMiddleware<A> {
    init?: (builder: Argv<any>) => void;

    loadEnv: (
        argv: Arguments<A>
    ) => Record<string, any> | Promise<Record<string, any>> | never;

    loadSecrets?: (
        argv: Arguments<A>
    ) => Record<string, any> | Promise<Record<string, any>> | never;
}

export interface EnvConfigMiddleware {
    key: string;

    loader: EnvMiddleware<any>;

    config?: Record<string, unknown>;
}
