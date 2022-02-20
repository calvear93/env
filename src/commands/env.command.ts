import { spawn } from 'child_process';
import { CommandModule } from 'yargs';
import { CommandArguments } from '../arguments';
import { Logger } from 'tslog';

const log: Logger = new Logger({
    displayInstanceName: true,
    instanceName: 'ENV',
    setCallerAsLoggerName: true,
    displayDateTime: false,
    displayLoggerName: false,
    displayRequestId: false,
    displayFunctionName: false,
    displayFilePath: 'hidden'
});

export interface EnvCommandArguments extends CommandArguments {
    subcmd: string[];
}

export const envCommand: CommandModule<any, EnvCommandArguments> = {
    command: '$0 [options..] [: <subcmd>]',
    describe: 'Inject environment variables into process',
    builder: (builder) => {
        builder.options({
            subcmd: {
                type: 'array',
                describe: 'Command for inject environment variables'
            }
        });

        return builder;
    },
    handler: (argv) => {
        process.env.TEST = 'test wadafoca';

        spawn(argv.subcmd[0], argv.subcmd.slice(1), { stdio: 'inherit' });

        log.info('I am a silly log 1.');
        log.debug('I am a silly log 2.');
        log.silly('I am a silly log 3.');
    }
};
