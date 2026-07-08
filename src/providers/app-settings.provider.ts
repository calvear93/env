import pc from 'picocolors';
import type { CommandArguments } from '../arguments.js';
import type { EnvProvider } from '../interfaces/index.js';
import { logger as globalLogger, readJson } from '../utils/index.js';

const KEY = 'app-settings';

const logger = globalLogger.getSubLogger({
	prefix: [pc.bold(pc.blue(`[${KEY}]`))],
});

interface AppSettingsCommandArguments extends CommandArguments {
	envFile: string;
}

/**
 * Loads config from appsettings.json.
 */
export const AppSettingsProvider: EnvProvider<AppSettingsCommandArguments> = {
	key: KEY,

	builder: (builder) => {
		builder.options({
			envFile: {
				alias: 'ef',
				default: '[[root]]/appsettings.json',
				describe: 'Environment variables file path (non secrets)',
				group: KEY,
				type: 'string',
			},
		});
	},

	load: async ({ ci, env, envFile, modes = [], root }) => {
		const [appsettings = {}, wasFound] = await readJson(envFile);

		if (!wasFound) logger.warn(`${pc.blue(envFile)} not found`);

		const composite =
			appsettings['|DEFAULT|'] ||
			appsettings['|ENV|'] ||
			appsettings['|MODE|'] ||
			appsettings['|LOCAL|'];

		const [envFileSettings, envLocalFileSettings, ...modeFileSettings] =
			await Promise.all([
				readJson(`${root}/appsettings.${env}.json`).then(
					([settings]) => settings,
				),
				readJson(`${root}/appsettings.${env}.local.json`).then(
					([settings]) => (ci ? {} : settings),
				),
				...modes.map((mode) =>
					readJson(`${root}/appsettings.${mode}.json`).then(
						([settings]) => settings,
					),
				),
			]);

		// only load local in env load cmd
		if (ci) appsettings['|LOCAL|'] = null;

		// order defines section + file merge precedence (later entries win):
		// flat root < |DEFAULT| < |ENV| < |MODE| < appsettings.<env>.json
		// < appsettings.<mode>.json < |LOCAL| < appsettings.<env>.local.json.
		// Local layers are always highest — do NOT reorder.
		return [
			composite ? {} : appsettings,

			appsettings['|DEFAULT|'],

			appsettings['|ENV|']?.[env],

			...modes.map((mode) => appsettings['|MODE|']?.[mode]),

			envFileSettings,

			...modeFileSettings,

			appsettings['|LOCAL|']?.[env],

			envLocalFileSettings,
		];
	},
};
