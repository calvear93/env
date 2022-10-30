import chalk from 'chalk';
import { CommandArguments } from '../arguments';
import { EnvProvider } from '../interfaces';
import { logger as globalLogger, readJson } from '../utils';

const KEY = 'secrets';

const logger = globalLogger.getChildLogger({
	prefix: [chalk.bold.blue(`[${KEY}]`)]
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
				group: KEY,
				alias: 'sf',
				type: 'string',
				default: '[[root]]/[[env]].env.json',
				describe: 'Secret variables file path'
			}
		});
	},

	load: async ({ env, secretsFile }) => {
		if (!env) {
			logger.silly('no env, provider skipped');

			return [];
		}

		const [secrets] = await readJson(secretsFile);

		return [secrets];
	}
};
