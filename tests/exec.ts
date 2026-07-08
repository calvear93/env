import { execSync } from 'node:child_process';

const CMD = 'node dist/main.js';

const BASE_ARGS = ['--root tests/env'];

// pnpm injects the running script name (i.e. "test:int") into children,
// which would trigger env inference from npm_lifecycle_event; on Windows
// the key casing is OS/tool-dependent (vitest workers get it uppercased),
// so every variant must be dropped before setting our own
export const scriptEnv = (script: string): NodeJS.ProcessEnv => {
	const entries = Object.entries(process.env).filter(
		([key]) => key.toLowerCase() !== 'npm_lifecycle_event',
	);

	return { ...Object.fromEntries(entries), npm_lifecycle_event: script };
};

const ENV = scriptEnv('');

export const execEnv = (...args: string[]): string | undefined => {
	return execSync(
		`${CMD} ${[...BASE_ARGS, '--log error', ...args].join(' ')}`,
		{
			env: ENV,
		},
	)?.toString();
};

export const execDebugEnv = (...args: string[]): string | undefined => {
	return execSync(
		`${CMD} ${[...BASE_ARGS, '--log debug', ...args].join(' ')}`,
		{
			env: ENV,
		},
	)?.toString();
};

export { execSync as exec } from 'node:child_process';
