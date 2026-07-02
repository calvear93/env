import { describe, expect, test } from 'vitest';
import { execDebugEnv } from './exec.js';

// none of the fixture providers implements pull/push,
// so both commands must warn instead of failing
describe('pull & push commands', () => {
	test('pull warns when no provider supports pulling', () => {
		const response = execDebugEnv('pull', '-e dev');

		expect(response).not.toMatch(/error/i);
		expect(response).toMatch(/no providers for pull variables/);
	});

	test('push warns when no provider supports pushing', () => {
		const response = execDebugEnv('push', '-e dev');

		expect(response).not.toMatch(/error/i);
		expect(response).toMatch(/no providers for push variables/);
	});
});
