import { spawn } from 'child_process';
import { CommandModule } from 'yargs';
import { CommandArguments } from '../arguments';

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
                'env -e dev -m test unit : npm start',
                'Load "dev" environment variables, in "test" and "unit" modes, for "npm start" command'
            )
            .check((argv): boolean => {
                if (argv._.length === 0 && !argv.subcmd) {
                    throw new Error(
                        'No one subcommand provided for exec after :'
                    );
                }

                // prepare(argv.root as string);

                return true;
            });

        return builder;
    },
    handler: (argv) => {
        process.env.TEST = 'test wadafoca';

        console.debug(argv);

        spawn(argv.subcmd[0], argv.subcmd.slice(1), {
            stdio: 'inherit',
            shell: true
        }).on('exit', (code) => {
            if (code === 0) console.info('process finished successfully');
            else console.error('process finished with error');
        });
    }
};
