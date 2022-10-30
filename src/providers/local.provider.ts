import chalk from 'chalk';
import { existsSync } from 'fs';
import { CommandArguments } from '../arguments';
import { EnvProvider } from '../interfaces';
import { logger as globalLogger, readJson, writeJson } from '../utils';

const KEY = 'local';

const logger = globalLogger.getChildLogger({
	prefix: [chalk.bold.blue(`[${KEY}]`)]
});

interface LocalCommandArguments extends CommandArguments {
	localFile: string;
}

/**
 * Loads local variables from env files in env folder.
 */
export const LocalProvider: EnvProvider<LocalCommandArguments> = {
	key: KEY,

	builder: (builder) => {
		builder.options({
			localFile: {
				group: KEY,
				alias: 'lf',
				type: 'string',
				default: '[[root]]/[[env]].local.env.json',
				describe: 'Local secret variables file path'
			}
		});
	},

	load: async ({ env, localFile, ci }) => {
		// ci mode doesn't load local vars
		if (ci) return [];

		if (!env) {
			logger.silly('no env, provider skipped');

			return [];
		}

		if (!existsSync(localFile)) {
			await writeJson(localFile, {});

			return [];
		}

		const [vars] = await readJson(localFile);

		return [vars];
	}
};
