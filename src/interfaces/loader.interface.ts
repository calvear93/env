import { Arguments, Argv } from 'yargs';

/**
 * Result of provider environment load.
 *
 * @export
 * @type EnvResult
 */
export type EnvResult =
    | Record<string, unknown>
    | Record<string, unknown>[]
    | Promise<Record<string, unknown>>
    | Promise<Record<string, unknown>[]>;

/**
 * Wrapped provider result for inject to env.
 *
 * @export
 * @interface EnvProviderResult
 */
export interface EnvProviderResult {
    key: string;
    config?: Record<string, unknown>;
    value: Record<string, any> | Record<string, any>[];
}

/**
 * Provider handler.
 *
 * @export
 * @interface EnvProvider
 * @template A define arguments used by provider
 * @template C define config used by provider
 */
export interface EnvProvider<
    A,
    C extends Record<string, any> | undefined = undefined
> {
    // unique key
    key: string;

    // modifies command building (adds or modifies commands, options .etc)
    builder?: (builder: Argv<unknown>) => void;

    // loads environment variables.
    load: (argv: Arguments<A>, config?: C) => EnvResult | never;

    // pulls vars
    pull?: (argv: Arguments<A>, config?: C) => void;

    // push vars
    push?: (argv: Arguments<A>, config?: C) => void;
}

/**
 * Provider definition for config file.
 *
 * @export
 * @interface EnvProviderConfig
 */
export interface EnvProviderConfig {
    path: string;
    type: 'integrated' | 'module' | 'script';
    handler: EnvProvider<any, any>;
    config?: Record<string, unknown>;
}
