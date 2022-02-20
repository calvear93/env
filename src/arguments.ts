import { Arguments, Options } from 'yargs';

export interface CommandArguments extends Arguments {
    env: string;
    mode: string[];
    root: string;
    config: string;
    envFile: string;
    envFormat: string;
    secretsFile: string;
    expand: boolean;
    subcmd: string[];
}

// common CLI arguments
export const args: Record<keyof CommandArguments, Options> = {
    env: {
        alias: 'e',
        type: 'string',
        requiresArg: true,
        describe: 'Environment, i.e. dev, prod'
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
    config: {
        alias: 'c',
        type: 'string',
        default: '[[root]]/env.config.json'
    },
    envFile: {
        type: 'string',
        default: '[[root]]/appsettings.json'
    },
    envFormat: {
        type: 'string',
        default: 'json',
        choices: ['json', 'env', 'yml', 'yaml']
    },
    secretsFile: {
        type: 'string',
        default: '[[root]]/secrets/[[env]].env.json'
    },
    expand: {
        alias: 'x',
        type: 'boolean',
        default: false,
        describe: 'Expand environment variables into command'
    },
    subcmd: {
        type: 'array',
        describe: 'Command for inject environment variables'
    }
};
