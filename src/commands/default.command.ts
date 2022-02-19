import { CommandModule } from 'yargs';
import { CommandArguments } from '../arguments';

export const defaultCommand: CommandModule<any, CommandArguments> = {
    command: '$0',
    describe: 'Inject you environment variables into process.env',
    handler: ({ argv }) => {
        console.log('inject running');
    }
};
