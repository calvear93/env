import { CommandModule } from 'yargs';
import { CommandArguments } from '../arguments';

export const pushCommand: CommandModule<any, CommandArguments> = {
    command: 'push',
    describe: 'Pushes secrets from providers',
    handler: ({ argv }) => {
        console.log('push running');
    }
};
