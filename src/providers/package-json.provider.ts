import { Arguments, Argv } from 'yargs';
import { CommandArguments } from '../arguments';
import { EnvProvider } from '../interfaces';

const KEY = 'package-json';

interface PackageJsonCommandArguments extends CommandArguments {
    varPrefix: string;
}

export const PackageJsonProvider: EnvProvider<PackageJsonCommandArguments> = {
    key: KEY,

    builder: (builder: Argv<CommandArguments>) => {
        builder.options({
            varPrefix: {
                group: KEY,
                alias: 'vp',
                type: 'string',
                default: '',
                describe: 'Prefix for loaded variables'
            }
        });
    },

    load: ({ env }: Arguments<CommandArguments>) => {
        return {
            ENV: 'yeh'
        };
    }
};
