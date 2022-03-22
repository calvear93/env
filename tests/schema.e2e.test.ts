import { execEnv } from './exec';

describe('e2e schema command', () => {
    test('schema', () => {
        const response = execEnv('schema', '-e dev', '-m debug');

        expect(response).not.toMatch(/error/i);
    });
});
