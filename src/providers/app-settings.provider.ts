import chalk from 'chalk';
import { CommandArguments } from '../arguments';
import { EnvProvider } from '../interfaces';
import { logger, readJson, writeJson } from '../utils';

const KEY = 'app-settings';

const APP_SETTINGS_DEFAULT = {
    '|DEFAULT|': {},
    '|MODE|': {},
    '|ENV|': {}
};

interface AppSettingsCommandArguments extends CommandArguments {
    envFile: string;
    sectionPrefix: string;
}

/**
 * Loads config from appsettings.json.
 */
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
                default: '',
                describe: 'Prefix for env and modes in env file'
            }
        });
    },

    load: async ({ env, modes = [], envFile, sectionPrefix }) => {
        const [appsettings = APP_SETTINGS_DEFAULT, wasFound] = await readJson(
            envFile
        );

        if (!wasFound) {
            logger.warn(`${chalk.blue(envFile)} not found`);

            logger.debug(`creating default ${chalk.blue(envFile)} file`);

            await writeJson(envFile, APP_SETTINGS_DEFAULT);
        }

        return [
            appsettings['|DEFAULT|'],

            appsettings['|ENV|']?.[`${sectionPrefix}${env}`],

            ...modes.map(
                (mode) => appsettings['|MODE|']?.[`${sectionPrefix}${mode}`]
            )
        ];
    }
};
