import { existsSync } from 'fs';
import { CommandArguments } from '../arguments';
import { EnvProvider } from '../interfaces';
import { readJson, writeJson } from '../utils';

const KEY = 'local';

interface LocalCommandArguments extends CommandArguments {
    localFile: string;
}

/**
 * Loads local variables from env files in env folder.
 */
export const LocalProvider: EnvProvider<LocalCommandArguments> = {
    key: KEY,

    builder: (builder) => {
        builder.options({
            localFile: {
                group: KEY,
                alias: 'lf',
                type: 'string',
                default: '[[root]]/[[env]].local.env.json',
                describe: 'Local secret variables file path'
            }
        });
    },

    load: async ({ localFile, ci }) => {
        // ci mode doesn't load local vars
        if (ci) return [];

        if (!existsSync(localFile)) {
            await writeJson(localFile, {});

            return [];
        }

        const [vars] = await readJson(localFile);

        return [vars];
    }
};
