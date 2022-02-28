import { EnvConfigMiddleware } from './interfaces';
import { TLogLevelName } from 'tslog';
import { Arguments, Options } from 'yargs';

const GROUPS = {
    LOG_WORKSPACE: 'Workspace Options',
    GROUP_WORKSPACE: 'Workspace Options'
};

export interface CommandArguments extends Arguments {
    logLevel?: TLogLevelName;
    env?: string;
    mode?: string[];
    middleware?: EnvConfigMiddleware[];
    nestingDelimiter?: string;
    root?: string;
    configFile?: string;
    envFile?: string;
    secretsFile?: string;
    localSecretsFile?: string;
}

// common CLI arguments
export const args: Record<keyof CommandArguments, Options> = {
    logLevel: {
        group: GROUPS.LOG_WORKSPACE,
        alias: 'log',
        type: 'string',
        default: 'silly',
        choices: ['silly', 'trace', 'debug', 'info', 'warn', 'error', 'fatal']
    },
    logMaskAnyRegEx: {
        group: GROUPS.LOG_WORKSPACE,
        alias: 'mrx',
        type: 'array',
        hidden: true,
        default: []
    },
    logMaskValuesOfKeys: {
        group: GROUPS.LOG_WORKSPACE,
        alias: 'mvk',
        type: 'array',
        hidden: true,
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
    middleware: {
        type: 'array',
        hidden: true,
        default: [],
        describe: 'Middlewares or providers for handling variables loading'
    },
    nestingDelimiter: {
        alias: 'nd',
        type: 'string',
        default: '__',
        describe:
            'Nesting level delimiter for flatten, i.e. { l1: { l2: "value" } } turns into { l1__l2: "value" }'
    },
    root: {
        group: GROUPS.GROUP_WORKSPACE,
        type: 'string',
        default: 'env',
        describe: 'Default environment folder path'
    },
    configFile: {
        group: GROUPS.GROUP_WORKSPACE,
        alias: 'c',
        type: 'string',
        default: '[[root]]/env.config.json',
        describe: 'Config JSON file path'
    },
    envFile: {
        group: GROUPS.GROUP_WORKSPACE,
        alias: 'ef',
        type: 'string',
        default: '[[root]]/appsettings.json',
        describe: 'Environment variables file path (non secrets)'
    },
    secretsFile: {
        group: GROUPS.GROUP_WORKSPACE,
        alias: 'sf',
        type: 'string',
        default: '[[root]]/secrets/[[env]].env.json',
        describe: 'Secrets per environment file path'
    },
    localSecretsFile: {
        group: GROUPS.GROUP_WORKSPACE,
        alias: 'lsf',
        type: 'string',
        default: '[[root]]/secrets/[[env]].local.env.json',
        describe: 'Secrets per environment file path'
    }
};
