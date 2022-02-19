import { CommandModule } from 'yargs';
import { CommandArguments } from '../arguments';

export const pullCommand: CommandModule<any, CommandArguments> = {
    command: 'pull [options..]',
    describe: 'Pulls secrets from providers',
    handler: (argv) => {
        console.log('pull running');
    }
};
