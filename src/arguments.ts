import { TLogLevelName } from 'tslog';
import { Arguments, InferredOptionTypes, Options } from 'yargs';

const GROUP_WORKSPACE = 'Workspace Options';

export interface CommandArguments extends Arguments {
    logLevel: TLogLevelName;
    env: string;
    mode: string[];
    root: string;
    configFile: string;
    envFile: string;
    secretsFile: string;
    localSecretsFile: string;
}

// common CLI arguments
export const args: Record<keyof CommandArguments, Options> = {
    logLevel: {
        alias: 'log',
        type: 'string',
        default: 'trace',
        choices: ['silly', 'trace', 'debug', 'info', 'warn', 'error', 'fatal']
    },
    logMaskAnyRegEx: {
        alias: 'mrx',
        type: 'array',
        default: []
    },
    logMaskValuesOfKeys: {
        alias: 'mvk',
        type: 'array',
        default: []
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
        group: GROUP_WORKSPACE,
        type: 'string',
        default: 'env',
        describe: 'Default environment folder path'
    },
    configFile: {
        group: GROUP_WORKSPACE,
        alias: 'c',
        type: 'string',
        default: '[[root]]/env.config.json',
        describe: 'Config JSON file path'
    },
    envFile: {
        group: GROUP_WORKSPACE,
        alias: 'ef',
        type: 'string',
        default: '[[root]]/appsettings.json',
        describe: 'Environment variables file path (non secrets)'
    },
    secretsFile: {
        group: GROUP_WORKSPACE,
        alias: 'sf',
        type: 'string',
        default: '[[root]]/secrets/[[env]].env.json',
        describe: 'Secrets per environment file path'
    },
    localSecretsFile: {
        group: GROUP_WORKSPACE,
        alias: 'lsf',
        type: 'string',
        default: '[[root]]/secrets/[[env]].local.env.json',
        describe: 'Secrets per environment file path'
    }
};
