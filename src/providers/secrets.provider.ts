import { Arguments, Argv } from 'yargs';
import { CommandArguments } from '../arguments';
import { EnvProvider } from '../interfaces';
import { readJson } from '../utils';

const KEY = 'secrets';

interface SecretsCommandArguments extends CommandArguments {
    secretFile: string;
    localSecretFile: string;
}

export const SecretsProvider: EnvProvider<
    SecretsCommandArguments,
    Record<string, any>
> = {
    key: KEY,

    builder: (builder: Argv<CommandArguments>) => {
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

    load: async ({
        secretFile,
        localSecretFile
    }: Arguments<SecretsCommandArguments>) => {
        const [secrets, secretWasFound] = await readJson(secretFile);
        const [localSecrets] = await readJson(localSecretFile);

        if (!secretWasFound)
            throw new Error(`${secretWasFound} does not found`);

        return [secrets, localSecrets];
    }
};
