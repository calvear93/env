import { CommandModule } from 'yargs';
import { CommandArguments } from '../arguments';
import { logger } from '../utils';

export interface PushCommandArguments extends CommandArguments {
    force: boolean;
}

export const pushCommand: CommandModule<any, PushCommandArguments> = {
    command: 'push [options..]',
    describe: 'Pushes secrets to providers',
    builder: (builder) => {
        builder
            .options({
                force: {
                    alias: 'o',
                    type: 'boolean',
                    default: false,
                    describe: 'Force push for secrets (replace all)'
                }
            })
            .example('env push -e dev', 'Download "dev" environment secrets');

        return builder;
    },
    handler: (argv) => {
        logger.silly('push running');
    }
};
