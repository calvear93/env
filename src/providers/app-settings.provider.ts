import { CommandArguments } from '../arguments';
import { EnvProvider } from '../interfaces';
import { logger, readJson } from '../utils';

const KEY = 'app-settings';

interface AppSettingsCommandArguments extends CommandArguments {
    envFile: string;
    sectionPrefix: string;
}

export const AppSettingsProvider: EnvProvider<AppSettingsCommandArguments> = {
    key: KEY,

    builder: (builder) => {
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

    load: async ({ env, modes, envFile, sectionPrefix }) => {
        const [appsettings, wasFound] = await readJson(envFile);

        if (!wasFound) {
            logger.error(`${envFile} not found`);

            process.exit(0);
        }

        return [
            appsettings['[DEFAULT]'],

            appsettings['[ENV]']?.[`${sectionPrefix}${env}`],

            ...modes.map(
                (mode) => appsettings['[MODE]']?.[`${sectionPrefix}${mode}`]
            )
        ];
    }
};
