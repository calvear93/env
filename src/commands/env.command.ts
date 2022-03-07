import chalk from 'chalk';
import { spawn } from 'child_process';
import { CommandModule } from 'yargs';
import { logger, normalize } from '../utils';
import { CommandArguments } from '../arguments';
import { EnvProviderResult } from '../interfaces';

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
                },
                expand: {
                    alias: 'x',
                    type: 'boolean',
                    default: false,
                    describe: 'Expand environment variables into subcommand'
                }
            })
            .example(
                'env -e dev -m test unit : npm test',
                'Load "dev" environment variables, in "test" and "unit" modes, for "npm start" command'
            )
            .example(
                'env -e dev -m debug : npm start : -c my-config.json',
                'Load "dev" environment variables, in "debug" mode, for "npm test" command and custom config file'
            )
            .check((argv): boolean => {
                // special check for custom argument
                if (argv._.length === 0 && !argv.subcmd) {
                    throw new Error(
                        'No one subcommand provided for exec after :'
                    );
                }

                return true;
            });

        return builder;
    },
    handler: async (argv) => {
        const loaders: EnvProviderResult[] = [];

        // execs sync and async loaders
        argv.providers?.forEach(({ path, handler, config }) => {
            logger.debug(`loading vars from ${chalk.yellow(path)} provider`);

            // non secrets loader
            loaders.push(handler.load(argv, config));
        });

        const results = await Promise.all(loaders);

        // results normalization merging
        const env = results.reduce((env, result, index) => {
            // JSON data flatten and normalization
            const vars = normalize(result, argv.nestingDelimiter);

            logger.silly(`loader [${index}]`, vars);

            return { ...env, ...vars };
        }, {});

        logger.debug('environment loaded:', env);
        logger.debug('injecting environment variables');

        // loads env vars to process.env
        process.env = {
            ...JSON.parse(JSON.stringify(process.env)),
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
