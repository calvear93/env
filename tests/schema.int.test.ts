import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';
import { execDebugEnv } from './exec.js';

const SCHEMA_FILE = 'tests/env/settings/schema.json';

describe('schema command', () => {
	test('generates the JSON schema from providers variables', () => {
		const response = execDebugEnv('schema', '-e dev', '-m debug');

		expect(response).not.toMatch(/error/i);
		expect(response).toMatch(/schema updated/);

		const schema = JSON.parse(readFileSync(SCHEMA_FILE, 'utf8'));
		// one schema per provider, with the loaded variables as properties
		expect(schema).toHaveProperty('local');
		expect(schema.local.properties).toHaveProperty('VAR4');
		expect(schema.local.properties).toHaveProperty('GROUP2');
	});
});
