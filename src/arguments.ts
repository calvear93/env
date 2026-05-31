import type { JSONSchemaType } from 'ajv';
import ci from 'ci-info';
import type { Arguments, Options } from 'yargs';
import type { EnvProviderConfig } from './interfaces/index.js';
import { IntegratedProviderConfig } from './providers/index.js';

const GROUPS = {
	CORE: 'Core Options',
	GROUP_WORKSPACE: 'Workspace Options',
	JSON_SCHEMA_WORKSPACE: 'JSON Schema Options',
	LOG_WORKSPACE: 'Logger Options',
};

export interface CommandArguments extends Arguments {
	arrayDescomposition: boolean;
	ci: boolean;
	configFile: string;
	detectFormat: boolean;
	env: string;
	expand: boolean;
	nestingDelimiter: string;
	nullable: boolean;
	packageJson: string;
	projectInfo: Record<string, string>;
	providers: EnvProviderConfig[];
	resolve: 'merge' | 'override';
	root: string;
	schemaFile: string;
	exportIgnoreKeys?: string[];
	logLevel?: 'debug' | 'error' | 'info' | 'silly' | 'trace' | 'warn';
	logMaskAnyRegEx?: string[];
	logMaskValuesOfKeys?: string[];
	modes?: string[];
	schema?: Record<string, JSONSchemaType<object>>;
}

// common CLI arguments
export const args: Record<keyof CommandArguments, Options> = {
	arrayDescomposition: {
		alias: 'arrDesc',
		default: false,
		describe: 'Whether serialize or break down arrays',
		group: GROUPS.CORE,
		type: 'boolean',
	},
	ci: {
		default: ci.isCI,
		describe: 'Run providers in continuous-integration mode (skips local files)',
		group: GROUPS.CORE,
		type: 'boolean',
	},
	configFile: {
		alias: 'c',
		default: '[[root]]/settings/settings.json',
		describe: 'Config JSON file path',
		group: GROUPS.GROUP_WORKSPACE,
		type: 'string',
	},
	detectFormat: {
		alias: 'df',
		default: false,
		describe: 'Whether format of strings variables are included in schema',
		group: GROUPS.JSON_SCHEMA_WORKSPACE,
		type: 'boolean',
	},
	env: {
		alias: 'e',
		describe: 'Environment to load, i.e. dev, prod',
		group: GROUPS.CORE,
		type: 'string',
	},
	expand: {
		alias: 'x',
		default: false,
		describe: 'Interpolate environment variables using themselves',
		group: GROUPS.CORE,
		type: 'boolean',
	},
	exportIgnoreKeys: {
		alias: 'iek',
		default: [],
		group: GROUPS.JSON_SCHEMA_WORKSPACE,
		hidden: true,
		type: 'array',
	},
	logLevel: {
		alias: 'log',
		choices: ['silly', 'trace', 'debug', 'info', 'warn', 'error'],
		default: 'info',
		describe: 'Log verbosity level',
		group: GROUPS.LOG_WORKSPACE,
		type: 'string',
	},
	logMaskAnyRegEx: {
		alias: 'mrx',
		default: [],
		describe: 'Mask log values matching these regular expressions',
		group: GROUPS.LOG_WORKSPACE,
		type: 'array',
	},
	logMaskValuesOfKeys: {
		alias: 'mvk',
		default: [],
		describe: 'Mask the values of these keys in logs',
		group: GROUPS.LOG_WORKSPACE,
		type: 'array',
	},
	modes: {
		alias: 'm',
		describe: 'Execution modes, i.e. debug, test',
		group: GROUPS.CORE,
		type: 'array',
	},
	nestingDelimiter: {
		alias: 'nd',
		default: '__',
		group: GROUPS.CORE,
		type: 'string',
		describe:
			'Nesting level delimiter for flatten, i.e. { l1: { l2: "value" } } turns into { l1__l2: "value" }',
	},
	nullable: {
		alias: 'null',
		default: true,
		describe: 'Whether variables are nullable',
		group: GROUPS.JSON_SCHEMA_WORKSPACE,
		type: 'boolean',
	},
	packageJson: {
		alias: ['pkg'],
		default: '',
		describe: 'package.json path',
		group: GROUPS.GROUP_WORKSPACE,
		type: 'string',
	},
	providers: {
		default: IntegratedProviderConfig,
		describe: 'Providers handling variables loading',
		hidden: true,
		type: 'array',
	},
	resolve: {
		alias: 'r',
		choices: ['merge', 'override'],
		default: 'merge',
		describe: 'Whether merges new schema or override',
		group: GROUPS.JSON_SCHEMA_WORKSPACE,
		type: 'string',
	},
	root: {
		default: 'env',
		describe: 'Default environment folder path',
		group: GROUPS.GROUP_WORKSPACE,
		type: 'string',
	},
	schemaFile: {
		alias: ['s', 'schema'],
		default: '[[root]]/settings/schema.json',
		describe: 'Environment Schema JSON file path',
		group: GROUPS.GROUP_WORKSPACE,
		type: 'string',
	},
};
