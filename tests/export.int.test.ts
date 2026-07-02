import { existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { execDebugEnv, execEnv } from './exec.js';

const OUT_DIR = '__reports__/export-int';

const out = (file: string) => join(OUT_DIR, file);

describe('export commands', () => {
	beforeAll(() => mkdirSync(OUT_DIR, { recursive: true }));

	afterAll(() => rmSync(OUT_DIR, { force: true, recursive: true }));

	test('exports a dotenv file with the loaded variables', () => {
		const uri = out('basic.env');
		const response = execDebugEnv(
			'export',
			'-e dev',
			'-m debug',
			`--uri ${uri}`,
		);

		expect(response).not.toMatch(/error/i);
		expect(response).toMatch(/exported \d+ variables/);

		const content = readFileSync(uri, 'utf8');
		expect(content).toMatch(/^NODE_ENV=development$/m);
		// dev.local.env.json overrides VAR4 from dev.env.json
		expect(content).toMatch(/^VAR4=any_local$/m);
		// nested variables are flattened with the nesting delimiter
		expect(content).toMatch(/^GROUP2__VAR1=g1v1$/m);
	});

	test('exports a valid json file when format is json', () => {
		const uri = out('basic.env.json');
		const response = execEnv('export', '-e dev', '-f json', `--uri ${uri}`);

		expect(response).not.toMatch(/error/i);

		const env = JSON.parse(readFileSync(uri, 'utf8'));
		expect(env.NODE_ENV).toBe('development');
		expect(env.VAR4).toBe('any_local');
	});

	test('wraps values in quotes with --quotes', () => {
		const uri = out('quoted.env');
		execEnv('export', '-e dev', '--quotes', `--uri ${uri}`);

		expect(readFileSync(uri, 'utf8')).toMatch(/^VAR4="any_local"$/m);
	});

	test('excludes keys listed in --exportIgnoreKeys', () => {
		const uri = out('ignored.env');
		execEnv('export', '-e dev', '--iek VAR4', `--uri ${uri}`);

		const content = readFileSync(uri, 'utf8');
		expect(content).not.toMatch(/^VAR4=/m);
		expect(content).toMatch(/^VAR3=12$/m);
	});

	test('preserves an existing file with --overwrite=false', () => {
		const uri = out('preserved.env');
		execEnv('export', '-e dev', `--uri ${uri}`);
		const original = readFileSync(uri, 'utf8');

		const response = execDebugEnv(
			'export',
			'-e dev',
			'-m debug',
			'--overwrite=false',
			`--uri ${uri}`,
		);

		expect(response).toMatch(/already exists/);
		expect(readFileSync(uri, 'utf8')).toBe(original);
	});

	test('overwrites an existing file by default', () => {
		const uri = out('overwritten.env');
		execEnv('export', '-e dev', `--uri ${uri}`);
		execEnv('export', '-e dev', '--iek VAR4', `--uri ${uri}`);

		expect(readFileSync(uri, 'utf8')).not.toMatch(/^VAR4=/m);
	});

	test('exports skipping schema validation with --validate=false', () => {
		const uri = out('unvalidated.env');
		const response = execEnv(
			'export',
			'-e dev',
			'--validate=false',
			`--uri ${uri}`,
		);

		expect(response).not.toMatch(/error/i);
		expect(existsSync(uri)).toBe(true);
	});
});
