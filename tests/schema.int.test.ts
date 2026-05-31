import { describe, expect, test } from 'vitest';
import { execEnv } from './exec.js';

describe('schema command', () => {
	test('schema', () => {
		const response = execEnv('schema', '-e dev', '-m debug');

		expect(response).not.toMatch(/error/i);
	});
});
