import { CommandArguments } from '../arguments';
import { EnvProvider } from '../interfaces';
import { readJson } from '../utils';

const KEY = 'secrets';

interface SecretsCommandArguments extends CommandArguments {
    secretsFolder: string;
    secretFile: string;
}

/**
 * Loads secrets from env files in env folder.
 */
export const SecretsProvider: EnvProvider<SecretsCommandArguments> = {
    key: KEY,

    builder: (builder) => {
        builder.options({
            secretsFolder: {
                group: KEY,
                type: 'string',
                default: '[[root]]',
                describe: 'Secret variables file path'
            },
            secretFile: {
                group: KEY,
                alias: 'sf',
                type: 'string',
                default: '[[secretsFolder]]/[[env]].env.json',
                describe: 'Secret variables file path'
            }
        });
    },

    load: async ({ secretFile }) => {
        const [secrets] = await readJson(secretFile);

        return [secrets];
    }
};
