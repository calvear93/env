import { CommandModule } from 'yargs';
import { CommandArguments } from '../arguments';
import { logger } from '../utils';

export interface PullCommandArguments extends CommandArguments {
    providers: any[];
    force: boolean;
}

export const pullCommand: CommandModule<any, PullCommandArguments> = {
    command: 'pull [options..]',
    describe: 'Pulls secrets from providers',
    builder: (builder) => {
        builder.options({
            providers: {
                type: 'array',
                describe: 'Plugins or providers for pull variables'
            },
            force: {
                alias: 'f',
                type: 'boolean',
                default: false,
                describe: 'Overwrite local variables'
            }
        });

        return builder;
    },
    handler: (argv) => {
        logger.silly('pull running');
    }
};
