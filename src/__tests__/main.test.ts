import { execEnv } from './exec';

const { log } = console;

describe('env command', () => {
    test('load env into run.js', () => {
        const response = execEnv(
            '-e dev',
            '--m debug',
            ': node src/__tests__/run.js'
        );

        log(response);

        expect(response).not.toMatch(/error/i);
    });
});
