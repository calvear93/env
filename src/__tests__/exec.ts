import { execSync } from 'child_process';

const CMD = 'node dist/main.js';

const BASE_ARGS = ['--root src/__tests__/env'];

export const execEnv = (...args: string[]): string | undefined => {
    return execSync(`${CMD} ${[...BASE_ARGS, ...args].join(' ')}`)?.toString();
};

export { execSync as exec } from 'child_process';
