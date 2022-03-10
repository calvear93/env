import chalk from 'chalk';
import { spawn } from 'child_process';
import { Arguments, CommandModule } from 'yargs';
import { logger, normalize } from '../utils';
import { CommandArguments } from '../arguments';
import { EnvProviderConfig, EnvProviderResult } from '../interfaces';

export interface EnvCommandArguments extends CommandArguments {
    subcmd: string[];
    expand: boolean;
}

export const envCommand: CommandModule<any, EnvCommandArguments> = {
    command: '$0 [options..] [: <subcmd> :]',
    describe: 'Inject environment variables into process',
    builder: (builder) => {
        builder
            .options({
                subcmd: {
                    type: 'array',
                    describe: 'Command for inject environment variables'
                }
            })
            .example(
                'env -e dev -m test unit : npm test',
                'Loads "dev" environment variables, in "test" and "unit" modes, for "npm start" command'
            )
            .example(
                'env -e dev -m debug : npm start : -c my-config.json',
                'Loads "dev" environment variables, in "debug" mode, for "npm test" command and custom config file'
            )
            .example(
                'env -e dev -m debug : npm start : -c [[root]]/[[env]].env.json',
                'Loads custom config file placed in root folder and named same as the env'
            )
            .check((argv): boolean => {
                // special check for custom argument
                if (argv._.length === 0 && !argv.subcmd) {
                    throw new Error(
                        'No one subcommand provided for exec surrounded by :'
                    );
                }

                return true;
            });

        return builder;
    },
    handler: async (argv) => {
        const loaders: EnvProviderResult[] = loadVariablesFromProviders(argv);

        // waits for async loaders
        const results = await Promise.all(loaders);

        // results normalization merging
        const env = normalizeResults(argv, results);

        logger.debug('environment loaded:', env);

        // loads env vars to process.env
        process.env = {
            ...process.env,
            ...env
        };

        logger.info(
            'executing command >',
            chalk.bold.yellow(argv.subcmd.join(' '))
        );

        spawn(argv.subcmd[0], argv.subcmd.slice(1), {
            stdio: 'inherit',
            shell: true
        }).on('exit', (code) => {
            if (code === 0) logger.info('process finished successfully');
            else logger.error('process finished with error');
        });
    }
};

/**
 * Executes load functions from provider handlers.
 *
 * @param {Arguments<EnvCommandArguments>} argv
 *
 * @returns {EnvProviderResult[]}
 */
function loadVariablesFromProviders({
    providers,
    ...argv
}: Arguments<EnvCommandArguments>): EnvProviderResult[] {
    const loaders: EnvProviderResult[] = [];

    // execs sync and async loaders
    providers?.forEach(({ handler: { key, load }, config }) => {
        logger.silly(`executing ${chalk.yellow(key)} provider`);

        const result = load(argv, config);

        if (load instanceof Promise) {
            loaders.push(
                result.then((result: EnvProviderResult) => ({
                    key,
                    config,
                    result
                }))
            );
        } else {
            loaders.push({ key, config, result });
        }
    });

    return loaders;
}

/**
 * Merges and normalies results from provider handlers.
 *
 * @param {Arguments<EnvCommandArguments>} argv
 * @param {Record<string, any>[]} results
 *
 * @returns {Record<string, any>}
 */
function normalizeResults(
    argv: Arguments<EnvCommandArguments>,
    results: Record<string, any>[]
): Record<string, any> {
    return results.reduce((env, { key, result }) => {
        // JSON data flatten and normalization
        const vars = normalize(
            result,
            argv.nestingDelimiter,
            argv.arrayDescomposition
        );

        logger.silly(`${chalk.yellow(key)} provider loaded:`, vars);

        return { ...env, ...vars };
    }, {});
}
