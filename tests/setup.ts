import { exec, execEnv } from './exec';

/**
 * Builds app and regenerates schema.
 */
function setup(): void {
    // builds application
    exec('npm run build');
    // generates schema from environment variables
    execEnv('schema', '-e dev', '-m debug');
}

export default setup;
