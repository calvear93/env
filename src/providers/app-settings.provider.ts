import { Arguments, Argv } from 'yargs';
import { CommandArguments } from '../arguments';
import { EnvProvider, EnvProviderConfig } from '../interfaces';
import { logger } from '../utils';

export const AppSettingsProvider: EnvProvider<CommandArguments> = {
    load: (
        argv: Arguments<CommandArguments>,
        config?: Record<string, any>
    ): Record<string, any> => {
        // const [appsettings, wasFound] = await readJson(argv.envFile);
        logger.debug('>> app settings loaded');

        return {
            TEST: 'wadamotherfoca',
            ENV: 'devsito',
            T1: {
                I_T8: null,
                I_T1: 'hola',
                I_T2: 'chao',
                I_T3: 12,
                I_T5: true,
                I_T4: {
                    I_I_T1: ['hola', 2, 4, 'hola', { a: 2 }]
                }
            }
        };
    }
};
