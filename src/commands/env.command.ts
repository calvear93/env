import chalk from 'chalk';
import merge from 'merge-deep';
import { spawn } from 'child_process';
import { CommandModule } from 'yargs';
import { CommandArguments } from '../arguments';
import {
    flatAndValidateResults,
    loadVariablesFromProviders,
    logger,
    normalize
} from '../utils';

export interface EnvCommandArguments extends CommandArguments {
    // Command for execute after inject environment variables.
    // Should be prefixed or surrounded by ':' character.
    subcmd: string[];
    // whether validate schema before injecting variables
    schemaValidate: boolean;
}

/**
 * Main command.
 * Injects environment variables into process.env.
 *
 * @example [>_]: env -e dev -m debug : npm start
 */
export const envCommand: CommandModule<any, EnvCommandArguments> = {
    command: '$0 [options..] [: <subcmd> :]',
    describe: 'Inject environment variables into process',
    builder: (builder) => {
        builder
            .options({
                subcmd: {
                    type: 'array',
                    describe: 'Command for inject environment variables'
                },
                schemaValidate: {
                    alias: 'validate',
                    type: 'boolean',
                    default: true,
                    describe: 'Whether validates variables using JSON schema'
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
                'env -e dev -m debug -c [[root]]/[[env]].env.json : npm start',
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
    handler: async ({ providers, ...argv }) => {
        const results = await loadVariablesFromProviders(providers, argv);

        let env = merge(
            { NODE_ENV: 'development' },
            ...flatAndValidateResults(results, argv)
        );

        // results normalization merging
        env = normalize(env, argv.nestingDelimiter, argv.arrayDescomposition);

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
            if (code === 0) {
                logger.info('process finished successfully');
            } else {
                logger.error('process finished with error');

                throw new Error('process finished with error');
            }
        });
    }
};
