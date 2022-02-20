import { Arguments, Options } from 'yargs';

export interface CommandArguments extends Arguments {
    env: string;
    mode: string[];
    root: string;
    config: string;
    envFile: string;
    envFormat: string;
    secretsFile: string;
}

// common CLI arguments
export const args: Record<keyof CommandArguments, Options> = {
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
        default: '[[root]]/env.config.json'
    },
    envFile: {
        type: 'string',
        default: '[[root]]/appsettings.json'
    },
    secretsFile: {
        type: 'string',
        default: '[[root]]/secrets/[[env]].env.json'
    },
    logLevel: {
        alias: 'log',
        type: 'number',
        default: 3,
        choices: [0, 1, 2, 3, 4, 5]
    }
};
