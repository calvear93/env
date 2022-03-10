import { Arguments, Options } from 'yargs';
import { EnvProviderConfig } from './interfaces';
import { IntegratedProviderConfig } from './providers';

const GROUPS = {
    LOG_WORKSPACE: 'Logger Options',
    GROUP_WORKSPACE: 'Workspace Options'
};

export interface CommandArguments extends Arguments {
    env: string;
    mode?: string[];
    providers: EnvProviderConfig[];
    schema: Record<string, unknown>;
    nestingDelimiter?: string;
    arrayDescomposition?: boolean;
    root?: string;
    configFile?: string;
    schemaFile?: string;
    logLevel?: string;
    logMaskAnyRegEx?: string[];
    logMaskValuesOfKeys?: string[];
}

// common CLI arguments
export const args: Record<keyof CommandArguments, Options> = {
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
    providers: {
        type: 'array',
        hidden: true,
        default: IntegratedProviderConfig,
        describe: 'Providers handling variables loading'
    },
    nestingDelimiter: {
        alias: 'nd',
        type: 'string',
        default: '__',
        describe:
            'Nesting level delimiter for flatten, i.e. { l1: { l2: "value" } } turns into { l1__l2: "value" }'
    },
    arrayDescomposition: {
        alias: 'arrDesc',
        type: 'boolean',
        default: false,
        describe: 'Whether serialize or break down arrays'
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
    schemaFile: {
        group: GROUPS.GROUP_WORKSPACE,
        alias: 's',
        type: 'string',
        default: '[[root]]/env.schema.json',
        describe: 'Environment Schema JSON file path'
    },
    logLevel: {
        group: GROUPS.LOG_WORKSPACE,
        alias: 'log',
        type: 'string',
        default: 'debug',
        choices: ['silly', 'trace', 'debug', 'info', 'warn', 'error']
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
    }
};
