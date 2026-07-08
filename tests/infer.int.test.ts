import { execSync } from 'node:child_process';
import { describe, expect, test } from 'vitest';
import { scriptEnv } from './exec.js';

const CMD = 'node dist/main.js --root tests/env';

const subcmd = ': node tests/run.js';

// simulates pnpm/npm injecting the running script name
const execWithScript = (script: string, ...args: string[]): string => {
	return execSync(`${CMD} ${args.join(' ')}`, {
		env: scriptEnv(script),
	}).toString();
};

describe('env inference from npm script name', () => {
	test('infers env from the script suffix (start:dev → dev)', () => {
		const response = execWithScript('start:dev', '--log debug', subcmd);

		expect(response).toMatch(/inferred from npm script/);
		expect(response).not.toMatch(/error/i);
	});

	test('aborts on unknown inferred env (start:e2etest)', () => {
		expect(() =>
			execWithScript('start:e2etest', '--log error', subcmd),
		).toThrow();
	});

	test('explicit -e wins over the script suffix', () => {
		const response = execWithScript(
			'start:e2etest',
			'-e dev',
			'--log debug',
			subcmd,
		);

		expect(response).not.toMatch(/inferred from npm script/);
		expect(response).not.toMatch(/error/i);
	});

	test('--help is not aborted by an unknown script suffix', () => {
		const response = execWithScript('start:e2etest', '--help');

		expect(response).toMatch(/usage/i);
	});
});
