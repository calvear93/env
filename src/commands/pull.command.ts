import pc from 'picocolors';
import type { CommandModule } from 'yargs';
import type { CommandArguments } from '../arguments.js';
import { logger, ui } from '../utils/index.js';

export interface PullCommandArguments extends CommandArguments {
	// whether variables should be overwritten in already exists
	overwrite: boolean;
}

/**
 * Pulls environment variables from providers.
 *
 * @example [>_]: env pull -e dev
 */
export const pullCommand: CommandModule<any, PullCommandArguments> = {
	command: 'pull [options..]',
	describe: 'Pull environment variables from provider stores',
	builder: (builder) => {
		builder
			.options({
				overwrite: {
					alias: 'o',
					default: false,
					describe: 'Overwrite local variables',
					type: 'boolean',
				},
			})
			.example('env pull -e dev', 'Download "dev" environment secrets')
			.example(
				'env pull -e dev -o',
				'Download and overwrite (if any exists) "dev" environment secrets',
			);

		return builder;
	},
	handler: async ({ providers, ...argv }) => {
		const pullProviders = providers.filter(
			({ handler: { pull } }) => !!pull,
		);
		const promises = await Promise.all(
			pullProviders.map(({ config, handler: { key, pull } }) => {
				logger.silly(`pulling from ${pc.yellow(key)} provider`);

				return pull!(argv, config);
			}),
		);

		if (promises.length > 0)
			ui.action('⬇️', `pulled from ${promises.length} provider(s)`);
		else logger.warn('no providers for pull variables');
	},
};
