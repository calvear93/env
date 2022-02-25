import { CommandModule } from 'yargs';
import { CommandArguments } from '../arguments';
import { logger } from '../utils';

export interface PullCommandArguments extends CommandArguments {
    providers: any[];
    overwrite: boolean;
}

export const pullCommand: CommandModule<any, PullCommandArguments> = {
    command: 'pull [options..]',
    describe: 'Pulls secrets from providers',
    builder: (builder) => {
        builder
            .options({
                providers: {
                    type: 'array',
                    describe: 'Plugins or providers for pull variables'
                },
                overwrite: {
                    alias: 'o',
                    type: 'boolean',
                    default: false,
                    describe: 'Overwrite local variables'
                }
            })
            .example('env pull -e dev', 'Download "dev" environment secrets')
            .example(
                'env pull -e dev -o',
                'Download and overwrite (if any exists) "dev" environment secrets'
            );

        return builder;
    },
    handler: (argv) => {
        logger.silly('pull running');
    }
};
