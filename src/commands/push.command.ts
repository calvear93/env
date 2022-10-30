import chalk from 'chalk';
import { CommandModule } from 'yargs';
import { CommandArguments } from '../arguments';
import { logger } from '../utils';

export interface PushCommandArguments extends CommandArguments {
	// forces to push in case of conflict
	force: boolean;
}

/**
 * Pushes environment variables to providers store.
 *
 * @example [>_]: env push -e dev
 */
export const pushCommand: CommandModule<any, PushCommandArguments> = {
	command: 'push [options..]',
	describe: 'Pushes environment variables to providers store',
	builder: (builder) => {
		builder
			.options({
				force: {
					alias: 'f',
					type: 'boolean',
					default: false,
					describe: 'Force push for secrets'
				}
			})
			.example('env push -e dev', 'Download "dev" environment secrets');

		return builder;
	},
	handler: async ({ providers, ...argv }) => {
		const promises = await Promise.all(
			providers
				.filter(({ handler: { push } }) => !!push)
				.map(({ handler: { key, push }, config }) => {
					logger.silly(`pushing to ${chalk.yellow(key)} provider`);

					return push!(argv, config);
				})
		);

		if (promises.length > 0)
			logger.info('environment variables pushed successfully');
		else logger.warn('no providers for push variables');
	}
};
