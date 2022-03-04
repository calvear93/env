import { Arguments, CommandModule } from 'yargs';
import { spawn } from 'child_process';
import { CommandArguments } from '../arguments';
import { logger, normalize, readJson } from '../utils';
import { EnvMiddleware } from 'interfaces';

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
    handler: (argv) => {
        logger.info('loading environment variables');

        // let env = middleware.loadEnv(argv);
        // // awaits for async middleware
        // if (env instanceof Promise) env = await env;
        // // JSON data flatten and normalization
        // env = normalize(env, argv.nestingDelimiter);

        // logger.debug('environment loaded:', env);
        // logger.info('injecting environment variables');

        // // loads env vars to process.env
        // for (const key in env) process.env[key] = env[key];

        spawn(argv.subcmd[0], argv.subcmd.slice(1), {
            stdio: 'inherit',
            shell: true
        }).on('exit', (code) => {
            if (code === 0) logger.info('process finished successfully');
            else logger.error('process finished with error');
        });
    }
};
