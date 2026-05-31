import pc from 'picocolors';
import type { CommandArguments } from '../arguments.js';
import type { EnvProvider } from '../interfaces/index.js';
import { logger as globalLogger, readJson } from '../utils/index.js';

const KEY = 'secrets';

const logger = globalLogger.getSubLogger({
	prefix: [pc.bold(pc.blue(`[${KEY}]`))],
});

interface SecretsCommandArguments extends CommandArguments {
	secretsFile: string;
}

/**
 * Loads secrets from env files in env folder.
 */
export const SecretsProvider: EnvProvider<SecretsCommandArguments> = {
	key: KEY,

	builder: (builder) => {
		builder.options({
			secretsFile: {
				alias: 'sf',
				default: '[[root]]/[[env]].env.json',
				describe: 'Secret variables file path',
				group: KEY,
				type: 'string',
			},
		});
	},

	load: async ({ env, secretsFile }) => {
		if (!env) {
			logger.silly('no env, provider skipped');

			return [];
		}

		const [secrets] = await readJson(secretsFile);

		return [secrets];
	},
};
