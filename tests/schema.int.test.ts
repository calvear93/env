import { execEnv } from './exec';

describe('schema command', () => {
	test('schema', () => {
		const response = execEnv('schema', '-e dev', '-m debug');

		expect(response).not.toMatch(/error/i);
	});
});
