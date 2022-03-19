import { execEnv } from './exec';

const subcmd = ': node src/__tests__/run.js';

describe('env command', () => {
    test('load env into run.js', () => {
        const response = execEnv('-e dev', '--m debug', subcmd);

        expect(response).not.toMatch(/error/i);
    });

    test('load env without modes into run.js', () => {
        const response = execEnv('-e dev', ': node src/__tests__/run.js');

        expect(response).not.toMatch(/error/i);
    });

    test('load env with two modes into run.js', () => {
        const response = execEnv('-e dev', '--m debug build', subcmd);

        expect(response).not.toMatch(/error/i);
    });

    test('load env with options after subcmd', () => {
        const response = execEnv('-e dev', subcmd, ': -m debug');

        expect(response).not.toMatch(/error/i);
    });
});
