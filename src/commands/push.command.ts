import { CommandModule } from 'yargs';
import { CommandArguments } from '../arguments';
import { logger } from '../utils';

export const pushCommand: CommandModule<any, CommandArguments> = {
    command: 'push [options..]',
    describe: 'Pushes secrets to providers',
    handler: (argv) => {
        logger.silly('push running');
    }
};
