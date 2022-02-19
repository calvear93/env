import { Argv, InferredOptionTypes } from 'yargs';

// Common CLI arguments
export const args = {
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
        default: 'env.config.json',
        describe: 'Config file name'
    }
} as const;

export type CommandArguments = Argv<InferredOptionTypes<typeof args>>;
