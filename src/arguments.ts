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
        default: 'env/env.config.json'
    },
    expand: {
        alias: 'x',
        type: 'boolean',
        default: false,
        describe: 'Expand environment variables into command'
    }
} as const;

export type CommandArguments = typeof args;
