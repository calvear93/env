import { execEnv } from './exec';

describe('e2e export commands', () => {
    test('export', () => {
        const response = execEnv('export', '-e dev', '-m debug');

        expect(response).not.toMatch(/error/i);
    });
});
