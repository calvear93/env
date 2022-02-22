import { TLogLevelName } from 'tslog';
import { Arguments, InferredOptionTypes, Options } from 'yargs';

export interface CommandArguments extends Arguments {
    env: string;
    mode: string[];
    root: string;
    config: string;
    envFile: string;
    secretsFile: string;
    logLevel: TLogLevelName;
}

// common CLI arguments
export const args: Record<keyof CommandArguments, Options> = {
    logLevel: {
        alias: 'log',
        type: 'string',
        default: 'trace',
        choices: ['silly', 'trace', 'debug', 'info', 'warn', 'error']
    },
    env: {
        alias: 'e',
        type: 'string',
        requiresArg: true,
        describe: 'Environment for load, i.e. dev, prod'
    },
    mode: {
        alias: 'm',
        type: 'array',
        requiresArg: true,
        describe: 'Execution modes, i.e. debug, test'
    },
    root: {
        type: 'string',
        default: 'env',
        describe: 'Default environment folder path'
    },
    configFile: {
        alias: 'c',
        type: 'string',
        default: '[[root]]/env.config.json',
        describe: 'Config JSON file path'
    },
    envFile: {
        alias: 'ef',
        type: 'string',
        default: '[[root]]/appsettings.json',
        describe: 'Environment variables file path (non secrets)'
    },
    secretsFile: {
        alias: 'sf',
        type: 'string',
        default: '[[root]]/secrets/[[env]].env.json',
        describe: 'Secrets per environment file path'
    },
    localSecretsFile: {
        alias: 'lsf',
        type: 'string',
        default: '[[root]]/secrets/[[env]].local.env.json',
        describe: 'Secrets per environment file path'
    }
};
