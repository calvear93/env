import { execSync } from 'child_process';

const CMD = 'node dist/main.js';

const BASE_ARGS = ['--root src/__tests__/env'];

const exec = (stdio: boolean, ...args: string[]): string | undefined => {
    return execSync(`${CMD} ${[...BASE_ARGS, ...args].join(' ')}`)?.toString();
};

describe('env command', () => {
    beforeAll(() => {
        // builds application
        execSync('npm run build');
        // generates schema from environment variables
        exec(false, 'schema', '-e dev', '-m debug');
    });

    test('load env into run.js', () => {
        const args = ['-e dev', '--m debug', ': node src/__tests__/run.js'];
        const response = exec(true, ...args);

        expect(response).not.toMatch(/error/i);
    });
});
