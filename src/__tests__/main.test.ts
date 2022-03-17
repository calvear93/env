import { execEnv } from './exec';

describe('env command', () => {
    test('load env into run.js', () => {
        const response = execEnv(
            '-e dev',
            '--m debug',
            ': node src/__tests__/run.js'
        );

        expect(response).not.toMatch(/error/i);
    });
});
