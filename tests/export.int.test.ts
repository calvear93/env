import { execEnv } from './exec';

describe('export commands', () => {
	test('export', () => {
		const response = execEnv('export', '-e dev', '-m debug');

		expect(response).not.toMatch(/error/i);
	});
});
