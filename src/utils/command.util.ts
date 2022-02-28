import chalk from 'chalk';
import { interpolate, logger, readJson } from '../utils';

/**
 * Injects config to command arguments from file.
 *
 * @param {Record<string, unknown>} argv
 * @param {[string, string]} delimiters
 */
export async function loadConfigFile(
    argv: Record<string, unknown>,
    delimiters: [string, string]
): Promise<void> {
    if (typeof argv.configFile === 'string') {
        const path = interpolate(argv.configFile, argv, delimiters);
        const [config, success] = await readJson<any>(path as string);

        if (success) {
            for (const key in config) argv[key] = config[key];
        } else {
            logger.warn(
                `config file ${chalk.underline.yellow(
                    path
                )} not found, using defaults`
            );
        }
    }
}
