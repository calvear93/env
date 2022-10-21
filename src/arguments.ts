import isCi from '@npmcli/ci-detect';
import { JSONSchemaType } from 'ajv';
import { Arguments, Options } from 'yargs';
import { EnvProviderConfig } from './interfaces';
import { IntegratedProviderConfig } from './providers';

const GROUPS = {
    LOG_WORKSPACE: 'Logger Options',
    GROUP_WORKSPACE: 'Workspace Options',
    JSON_SCHEMA_WORKSPACE: 'JSON Schema Options'
};

export interface CommandArguments extends Arguments {
    env: string;
    modes?: string[];
    app?: Record<string, unknown>;
    schema?: Record<string, JSONSchemaType<object>>;
    providers: EnvProviderConfig[];
    ci: boolean;
    nestingDelimiter: string;
    arrayDescomposition: boolean;
    expand: boolean;
    root: string;
    configFile: string;
    schemaFile: string;
    resolve: 'merge' | 'override';
    nullable: boolean;
    detectFormat: boolean;
    logLevel?: 'silly' | 'trace' | 'debug' | 'info' | 'warn' | 'error';
    logMaskAnyRegEx?: string[];
    logMaskValuesOfKeys?: string[];
}

// common CLI arguments
export const args: Record<keyof CommandArguments, Options> = {
    env: {
        alias: 'e',
        type: 'string',
        describe: 'Environment for load, i.e. dev, prod'
    },
    modes: {
        alias: 'm',
        type: 'array',
        describe: 'Execution modes, i.e. debug, test'
    },
    providers: {
        type: 'array',
        hidden: true,
        default: IntegratedProviderConfig,
        describe: 'Providers handling variables loading'
    },
    ci: {
        alias: 'ci',
        type: 'boolean',
        default: isCi(),
        describe: 'Whether providers executes in continuous integration mode'
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
    expand: {
        alias: 'x',
        type: 'boolean',
        default: false,
        describe: 'Interpolates environment variables using itself'
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
        default: '[[root]]/settings/settings.json',
        describe: 'Config JSON file path'
    },
    schemaFile: {
        group: GROUPS.GROUP_WORKSPACE,
        alias: ['s', 'schema'],
        type: 'string',
        default: '[[root]]/settings/schema.json',
        describe: 'Environment Schema JSON file path'
    },
    resolve: {
        group: GROUPS.JSON_SCHEMA_WORKSPACE,
        alias: 'r',
        type: 'string',
        default: 'merge',
        choices: ['merge', 'override'],
        describe: 'Whether merges new schema or override'
    },
    nullable: {
        group: GROUPS.JSON_SCHEMA_WORKSPACE,
        alias: 'null',
        type: 'boolean',
        default: true,
        describe: 'Whether variables are nullable'
    },
    detectFormat: {
        group: GROUPS.JSON_SCHEMA_WORKSPACE,
        alias: 'df',
        type: 'boolean',
        default: true,
        describe: 'Whether format of strings variables are included in schema'
    },
    logLevel: {
        group: GROUPS.LOG_WORKSPACE,
        alias: 'log',
        type: 'string',
        default: 'info',
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
