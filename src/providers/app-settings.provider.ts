import { Arguments, Argv } from 'yargs';
import { CommandArguments } from '../arguments';
import { EnvProvider } from '../interfaces';
import { readJson } from '../utils';

const KEY = 'app-settings';

interface AppSettingsCommandArguments extends CommandArguments {
    envFile: string;
    sectionPrefix: string;
}

export const AppSettingsProvider: EnvProvider<
    AppSettingsCommandArguments,
    Record<string, any>
> = {
    key: KEY,

    builder: (builder: Argv<CommandArguments>) => {
        builder.options({
            envFile: {
                group: KEY,
                alias: 'ef',
                type: 'string',
                default: '[[root]]/appsettings.json',
                describe: 'Environment variables file path (non secrets)'
            },
            sectionPrefix: {
                group: KEY,
                alias: 'sp',
                type: 'string',
                default: '::',
                describe: 'Prefix for env and modes in env file'
            }
        });
    },

    load: async ({
        env,
        modes,
        envFile,
        sectionPrefix
    }: Arguments<AppSettingsCommandArguments>) => {
        const [appsettings, wasFound] = await readJson(envFile);

        if (!wasFound) throw new Error(`${envFile} does not found`);

        return [
            appsettings['[DEFAULT]'],
            appsettings['[ENV]']?.[`${sectionPrefix}${env}`],
            ...modes.map(
                (mode) => appsettings['[MODE]']?.[`${sectionPrefix}${mode}`]
            )
        ];
    }
};
