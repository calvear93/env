import { describe, expect, test } from 'vitest';
import { execDebugEnv, execEnv } from './exec.js';

const subcmd = ': node tests/run.js';

describe('env command', () => {
	test('show helps', () => {
		const response = execEnv('--help');

		// tolerant to ANSI codes: words stay intact even when color-wrapped
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

	// settings.json -> logMaskValuesOfKeys: ["SECRET", "/group1/i"]
	test('masks exact key (SECRET) and /regex/ keys (GROUP1) together from config', () => {
		const response = execDebugEnv('-e dev', subcmd);

		expect(response).not.toMatch(/error/i);
		// exact entry "SECRET" still masks (backward compatible with non-regex defs)
		expect(response).not.toMatch(/any secret/i);
		// "/group1/i" masks every GROUP1__* key value (substring, case-insensitive)
		expect(response).not.toMatch(/g1g2v1/i);
		// a non-matching key (GROUP2__VAR1) keeps its value visible
		expect(response).toMatch(/g1v1/);
		// masked values render as the placeholder
		expect(response).toMatch(/\*{5}/);
	});

	// appsettings.json -> |ENV|.dev.GLOBAL.$VAR1 (the $ marks a global key)
	test('strips the $ global marker from nested keys when injecting', () => {
		const response = execDebugEnv('-e dev', subcmd);

		expect(response).not.toMatch(/error/i);
		// the marker must be removed: GLOBAL.$VAR1 -> GLOBAL__VAR1
		expect(response).toMatch(/GLOBAL__VAR1\b/);
		expect(response).toMatch(/globalv1/);
		// the raw $-prefixed key must never reach the environment
		expect(response).not.toMatch(/GLOBAL__\$VAR1/);
	});

	test('exact key mask still works when passed as a CLI flag', () => {
		// --mvk overrides the config list; a bare entry stays an exact key match
		const response = execDebugEnv('-e dev', '--mvk SECRET', subcmd);

		expect(response).not.toMatch(/error/i);
		expect(response).not.toMatch(/any secret/i);
		// group1 keys are no longer masked here (config list was overridden)
		expect(response).toMatch(/g1g2v1/i);
	});
});
