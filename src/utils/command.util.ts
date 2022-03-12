import chalk from 'chalk';
import { EnvCommandArguments } from 'commands/env.command';
import { Arguments } from 'yargs';
import { EnvProviderConfig, EnvProviderResult } from '../interfaces';
import { interpolate, logger, readJson } from '../utils';

/**
 * Injects config to command arguments from file.
 *
 * @param {Record<string, unknown>} argv
 * @param {[string, string]} delimiters
 */
export async function loadConfigFile(
    argv: Record<string, unknown>,
    delimiters: [string, string]
): Promise<void> {
    if (typeof argv.configFile === 'string') {
        const path = interpolate(argv.configFile, argv, delimiters);
        const [config, success] = await readJson(path);

        if (success) {
            for (const key in config) if (!argv[key]) argv[key] = config[key];
        } else {
            logger.warn(
                `config file ${chalk.underline.yellow(
                    path
                )} not found, using defaults`
            );
        }
    }
}

/**
 * Extracts subcommand from command line parameters.
 *
 * @export
 * @param {string[]} rawArgv process.argv.slice(2)
 * @param {[string, string]} delimiters
 *
 * @returns {string[]} subcommand for wrap if exists
 */
export function getSubcommand(rawArgv: string[], delimiters: [string, string]) {
    let subcommand: string[] = [];

    // subcommand delimiter indexes
    const begin = rawArgv.indexOf(delimiters[0]);
    const count = rawArgv.lastIndexOf(delimiters[1]) - begin;

    // calculates subcommand surrounded by delimiters
    if (begin > 0) {
        subcommand =
            count > 0
                ? rawArgv.splice(begin, count + 1).slice(1, -1)
                : rawArgv.splice(begin).slice(1);
    }

    return subcommand;
}

/**
 * Loads providers JSON schema from file.
 *
 * @param {Record<string, unknown>} argv
 * @param {[string, string]} delimiters
 *
 * @returns {Promise<Record<string, unknown>>}
 */
export async function loadSchemaFile(
    argv: Record<string, unknown>,
    delimiters: [string, string]
): Promise<Record<string, unknown> | undefined> {
    if (typeof argv.schemaFile === 'string') {
        const path = interpolate(argv.schemaFile, argv, delimiters);
        const [schema, success] = await readJson(path);

        return success ? schema : undefined;
    }

    return undefined;
}

/**
 * Reads project package.json.
 *
 * @export
 * @returns {Promise<Record<string, unknown>> | never}
 */
export async function loadProjectInfo(): Promise<
    Record<string, unknown> | undefined
> {
    try {
        return await import(`${process.cwd()}/package.json`);
    } catch {
        logger.warn(
            `project file ${chalk.underline.yellow('package.json')} not found`
        );

        return undefined;
    }
}

/**
 * Executes load functions from provider handlers.
 *
 * @param {EnvProviderConfig[]} providers
 * @param {Partial<Arguments<EnvCommandArguments>>} argv
 *
 * @returns {EnvProviderResult[]}
 */
export function loadVariablesFromProviders(
    providers: EnvProviderConfig[],
    argv: Partial<Arguments<EnvCommandArguments>>
): Promise<EnvProviderResult[]> {
    if (!providers) return [] as any;

    return Promise.all(
        providers.map(({ handler: { key, load }, config }) => {
            logger.silly(`executing ${chalk.yellow(key)} provider`);

            const result = load(argv, config);

            if (result instanceof Promise) {
                return result.then((result) => ({
                    key,
                    config,
                    result
                }));
            } else {
                return { key, config, result };
            }
        })
    );
}
