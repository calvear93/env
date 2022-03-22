import { existsSync } from 'fs';
import { exec, execEnv } from './exec';

/**
 * Builds app and regenerates schema.
 */
function setup(): void {
    // builds application
    if (!existsSync('dist')) exec('npm run build');
    // generates schema from environment variables
    execEnv('schema', '-e dev', '-m debug');
}

export default setup;
