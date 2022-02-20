import { CommandModule } from 'yargs';
import { CommandArguments } from '../arguments';

export const defaultCommand: CommandModule<any, CommandArguments> = {
    command: '$0 [options..] [: <cmd>]',
    describe: 'Inject environment variables into process',
    builder: (builder) => {
        builder.option('cmd', {
            type: 'string'
        });

        return builder;
    },
    handler: (argv) => {
        console.log(argv);
        console.log('inject running');
    }
};
