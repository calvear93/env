import { describe, expect, test } from 'vitest';
import { execEnv } from './exec.js';

describe('pull & push commands', () => {
	test('pull', () => {
		const response = execEnv('pull', '-e dev');

		expect(response).not.toMatch(/error/i);
	});

	test('push', () => {
		const response = execEnv('push', '-e dev');

		expect(response).not.toMatch(/error/i);
	});
});
