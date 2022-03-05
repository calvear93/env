import { Arguments, Argv } from 'yargs';
import { CommandArguments } from './arguments';
import { EnvMiddleware } from './interfaces';
import { logger } from './utils';

const MiddlewareDefault: EnvMiddleware<CommandArguments> = {
    loadEnv: (
        argv: Arguments<CommandArguments>,
        config?: Record<string, any>
    ): Record<string, any> => {
        // const [appsettings, wasFound] = await readJson(argv.envFile);
        return {
            TEST: 'wadamotherfoca',
            ENV: 'devsito',
            A3: () => 'asda',
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
    },

    loadSecrets: (
        argv: Arguments<CommandArguments>,
        config?: Record<string, any>
    ): Record<string, any> => {
        // const [appsettings, wasFound] = await readJson(argv.envFile);
        return {
            SECRET: '12313123'
        };
    }
};

export default MiddlewareDefault;
