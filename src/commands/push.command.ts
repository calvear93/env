import { CommandModule } from 'yargs';
import { CommandArguments } from '../arguments';

export const pushCommand: CommandModule<any, CommandArguments> = {
    command: 'push [options..]',
    describe: 'Pushes secrets to providers',
    handler: (argv) => {
        console.log('push running');
    }
};
