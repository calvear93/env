import { spawn } from 'child_process';
import { args } from '../arguments';

const spawnAsync = (cmd: string, ...args: string[]) =>
    new Promise((resolve, reject) => {
        spawn(cmd, args, {
            stdio: 'inherit',
            shell: true
        }).on('exit', (code) => {
            if (code === 0) resolve(true);
            else reject(new Error('process failed'));
        });
    });

describe('Test', () => {
    const CMD = 'node dist/main.js';

    beforeAll(async () => {
        await spawnAsync('npm', 'run build');
        await spawnAsync(
            CMD,
            'schema',
            '-e dev',
            '-m debug',
            '--root src/__tests__'
        );
    });

    test('t1', () => {
        // const args = [
        //     'pull',
        //     '--root src/__tests__',
        //     '-e dev',
        //     '--modes debug',
        //     ': node test.js'
        // ];

        // await spawnAsync(CMD);

        // console.log(process.env);

        expect(args).toBeDefined();
    });
});
