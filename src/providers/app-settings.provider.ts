import { Arguments, Argv } from 'yargs';
import { CommandArguments } from '../arguments';
import { EnvProvider, EnvProviderConfig } from '../interfaces';
import { logger } from '../utils';

interface AppSettingsCommandArguments extends CommandArguments {
    envFile: string;
}

export const AppSettingsProvider: EnvProvider<AppSettingsCommandArguments> = {
    key: 'app-settings',

    builder: (builder: Argv<CommandArguments>) => {
        builder.options({
            envFile: {
                alias: 'ef',
                type: 'string',
                default: '[[root]]/appsettings.json',
                describe: 'Environment variables file path (non secrets)'
            }
        });
    },
    load: (
        argv: Arguments<AppSettingsCommandArguments>,
        config?: Record<string, any>
    ): Record<string, any> => {
        // const [appsettings, wasFound] = await readJson(argv.envFile);

        return {
            VAR1: 'V1',
            VAR2: 'V2',
            VAR3: 3,
            ARR: ['A', 1, 2, 'B'],
            GROUP1: {
                VAR1: null,
                VAR2: 'G1V2',
                VAR3: true,
                GROUP2: {
                    VAR1: 'G1G2V1'
                }
            }
        };
    }
};
