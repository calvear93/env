import { CommandArguments } from '../arguments';
import { EnvProvider } from '../interfaces';

const KEY = 'package-json';

interface PackageJsonCommandArguments extends CommandArguments {
    varPrefix: string;
}

export const PackageJsonProvider: EnvProvider<PackageJsonCommandArguments> = {
    key: KEY,

    builder: (builder) => {
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

    load: ({ env, app, varPrefix }) => {
        return {
            [`${varPrefix}ENV`]: env,

            [`${varPrefix}VERSION`]: app?.version,
            [`${varPrefix}PROJECT`]: app?.project,
            [`${varPrefix}NAME`]: app?.name,
            [`${varPrefix}TITLE`]: app?.title,
            [`${varPrefix}DESCRIPTION`]: app?.description
        };
    }
};
