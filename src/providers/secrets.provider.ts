import { CommandArguments } from '../arguments';
import { EnvProvider } from '../interfaces';
import { logger, readJson } from '../utils';

const KEY = 'secrets';

interface SecretsCommandArguments extends CommandArguments {
    secretFile: string;
    localSecretFile: string;
}

export const SecretsProvider: EnvProvider<SecretsCommandArguments> = {
    key: KEY,

    builder: (builder) => {
        builder.options({
            secretFile: {
                group: KEY,
                alias: 'sf',
                type: 'string',
                default: '[[root]]/secrets/[[env]].env.json',
                describe: 'Secret variables file path'
            },
            localSecretFile: {
                group: KEY,
                alias: 'lsf',
                type: 'string',
                default: '[[root]]/secrets/[[env]].local.env.json',
                describe: 'Local secret variables file path'
            }
        });
    },

    load: async ({ secretFile, localSecretFile }) => {
        const [secrets, secretWasFound] = await readJson(secretFile);
        const [localSecrets] = await readJson(localSecretFile);

        if (!secretWasFound) {
            logger.error(`${secretWasFound} not found`);

            process.exit(1);
        }

        return [secrets, localSecrets];
    }
};
