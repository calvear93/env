import pc from 'picocolors';
import type { CommandModule } from 'yargs';
import type { CommandArguments } from '../arguments.js';
import { logger, ui } from '../utils/index.js';

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
	describe: 'Push environment variables to provider stores',
	builder: (builder) => {
		builder
			.options({
				force: {
					alias: 'f',
					default: false,
					describe: 'Force push for secrets',
					type: 'boolean',
				},
			})
			.example('env push -e dev', 'Download "dev" environment secrets');

		return builder;
	},
	handler: async ({ providers, ...argv }) => {
		const pushProviders = providers.filter(
			({ handler: { push } }) => !!push,
		);
		const promises = await Promise.all(
			pushProviders.map(({ config, handler: { key, push } }) => {
				logger.debug(`pushing to ${pc.yellow(key)} provider`);

				return push!(argv, config);
			}),
		);

		if (promises.length > 0)
			ui.action('⬆️', `pushed to ${promises.length} provider(s)`);
		else logger.warn('no providers for push variables');
	},
};
