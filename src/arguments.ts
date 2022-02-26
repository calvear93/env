import { TLogLevelName } from 'tslog';
import { Arguments, Options } from 'yargs';

const LOG_WORKSPACE = 'Workspace Options';

const GROUP_WORKSPACE = 'Workspace Options';

export interface CommandArguments extends Arguments {
    logLevel: TLogLevelName;
    env: string;
    mode: string[];
    nestingDelimiter: string;
    root: string;
    configFile: string;
    envFile: string;
    secretsFile: string;
    localSecretsFile: string;
}

// common CLI arguments
export const args: Record<keyof CommandArguments, Options> = {
    logLevel: {
        group: LOG_WORKSPACE,
        alias: 'log',
        type: 'string',
        default: 'silly',
        choices: ['silly', 'trace', 'debug', 'info', 'warn', 'error', 'fatal']
    },
    logMaskAnyRegEx: {
        group: LOG_WORKSPACE,
        alias: 'mrx',
        type: 'array',
        default: []
    },
    logMaskValuesOfKeys: {
        group: LOG_WORKSPACE,
        alias: 'mvk',
        type: 'array',
        default: []
    },
    env: {
        alias: 'e',
        type: 'string',
        requiresArg: true,
        demandOption: true,
        describe: 'Environment for load, i.e. dev, prod'
    },
    mode: {
        alias: 'm',
        type: 'array',
        requiresArg: true,
        demandOption: true,
        describe: 'Execution modes, i.e. debug, test'
    },
    nestingDelimiter: {
        alias: 'nd',
        type: 'string',
        default: '__',
        describe:
            'Nesting level delimiter for flatten, i.e. { l1: { l2: "value" } } turns into { l1__l2: "value" }'
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
