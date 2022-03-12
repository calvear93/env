import { Arguments, Argv } from 'yargs';
import { CommandArguments } from '../arguments';
import { EnvProvider, EnvProviderConfig } from '../interfaces';
import { logger, readJson } from '../utils';

const KEY = 'app-settings';

interface AppSettingsCommandArguments extends CommandArguments {
    envFile: string;
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

    load: async (
        argv: Arguments<AppSettingsCommandArguments>
    ): Promise<Record<string, unknown>> => {
        const [appsettings, wasFound] = await readJson(argv.envFile);

        return appsettings['[ENV]']['::dev'];
    }
};
