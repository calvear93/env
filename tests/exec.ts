import { execSync } from 'child_process';

const CMD = 'node dist/main.js';

const BASE_ARGS = ['--root tests/env'];

export const execEnv = (...args: string[]): string | undefined => {
	return execSync(
		`${CMD} ${[...BASE_ARGS, '--log error', ...args].join(' ')}`
	)?.toString();
};

export const execDebugEnv = (...args: string[]): string | undefined => {
	return execSync(
		`${CMD} ${[...BASE_ARGS, '--log debug', ...args].join(' ')}`
	)?.toString();
};

export { execSync as exec } from 'child_process';
