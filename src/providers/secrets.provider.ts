import { CommandArguments } from '../arguments';
import { EnvProvider } from '../interfaces';
import { readJson } from '../utils';

const KEY = 'secrets';

interface SecretsCommandArguments extends CommandArguments {
    secretsFolder: string;
    secretFile: string;
    localSecretFile: string;
}

/**
 * Loads secrets from env files in env/secrets folder.
 */
export const SecretsProvider: EnvProvider<SecretsCommandArguments> = {
    key: KEY,

    builder: (builder) => {
        builder.options({
            secretsFolder: {
                group: KEY,
                type: 'string',
                default: '[[root]]/secrets',
                describe: 'Secret variables file path'
            },
            secretFile: {
                group: KEY,
                alias: 'sf',
                type: 'string',
                default: '[[secretsFolder]]/[[env]].env.json',
                describe: 'Secret variables file path'
            },
            localSecretFile: {
                group: KEY,
                alias: 'lsf',
                type: 'string',
                default: '[[secretsFolder]]/[[env]].local.env.json',
                describe: 'Local secret variables file path'
            }
        });
    },

    load: async ({ secretFile, localSecretFile, local }) => {
        const [[secrets], [localSecrets]] = await Promise.all([
            await readJson(secretFile),
            // loads local variables only on load env cmd
            local ? await readJson(localSecretFile) : Promise.resolve([{}])
        ]);

        return [secrets, localSecrets];
    }
};
