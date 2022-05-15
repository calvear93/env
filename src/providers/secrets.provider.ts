import { CommandArguments } from '../arguments';
import { EnvProvider } from '../interfaces';
import { readJson } from '../utils';

const KEY = 'secrets';

interface SecretsCommandArguments extends CommandArguments {
    secretsFile: string;
}

/**
 * Loads secrets from env files in env folder.
 */
export const SecretsProvider: EnvProvider<SecretsCommandArguments> = {
    key: KEY,

    builder: (builder) => {
        builder.options({
            secretsFile: {
                group: KEY,
                alias: 'sf',
                type: 'string',
                default: '[[root]]/[[env]].env.json',
                describe: 'Secret variables file path'
            }
        });
    },

    load: async ({ secretsFile }) => {
        const [secrets] = await readJson(secretsFile);

        return [secrets];
    }
};
