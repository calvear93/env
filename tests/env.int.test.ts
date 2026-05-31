import { describe, expect, test } from 'vitest';
import { execDebugEnv, execEnv } from './exec.js';

const subcmd = ': node tests/run.js';

describe('env command', () => {
	test('show helps', () => {
		const response = execEnv('--help');

		// ANSI-tolerant: words stay intact even when wrapped in color codes
		expect(response).toMatch(/usage/i);
		expect(response).toMatch(/commands:/i);
		expect(response).toMatch(/env pull/);
	});

	test('load env into run.js', () => {
		const response = execEnv('-e dev', '--m debug', subcmd);

		expect(response).not.toMatch(/error/i);
	});

	test('load env without modes into run.js', () => {
		const response = execEnv('-e dev', ': node tests/run.js');

		expect(response).not.toMatch(/error/i);
	});

	test('load env with two modes into run.js', () => {
		const response = execEnv('-e dev', '--m debug build', subcmd);

		expect(response).not.toMatch(/error/i);
	});

	test('load env with options after subcmd', () => {
		const response = execEnv('-e dev', subcmd, ': -m debug');

		expect(response).not.toMatch(/error/i);
	});

	test('logger must not show SECRET variable value', () => {
		const response = execDebugEnv('-e dev', subcmd);

		expect(response).not.toMatch(/error/i);
		expect(response).not.toMatch(/any secret/i);
	});
});
