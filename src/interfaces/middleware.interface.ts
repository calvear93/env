import { Arguments, Argv } from 'yargs';

export interface EnvMiddleware {
    init?: (builder: Argv<any>) => void;

    loadEnv: (
        argv: Arguments<any>
    ) => Record<string, any> | Promise<Record<string, any>> | never;

    loadSecrets?: (
        argv: Arguments<any>
    ) => Record<string, any> | Promise<Record<string, any>> | never;
}
