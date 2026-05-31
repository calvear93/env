import { existsSync } from 'node:fs';
import pc from 'picocolors';
import type { CommandArguments } from '../arguments.js';
import type { EnvProvider } from '../interfaces/index.js';
import { logger as globalLogger, readJson, writeJson } from '../utils/index.js';

const KEY = 'local';

const logger = globalLogger.getSubLogger({
	prefix: [pc.bold(pc.blue(`[${KEY}]`))],
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
				alias: 'lf',
				default: '[[root]]/[[env]].local.env.json',
				describe: 'Local secret variables file path',
				group: KEY,
				type: 'string',
			},
		});
	},

	load: async ({ ci, env, localFile }) => {
		// ci mode doesn't load local vars
		if (ci) return [];

		if (!env) {
			logger.silly('no env, so skipping provider');

			return [];
		}

		if (!existsSync(localFile)) {
			await writeJson(localFile, {});

			return [];
		}

		const [vars] = await readJson(localFile);

		return [vars];
	},
};
