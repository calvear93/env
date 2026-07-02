import merge from 'merge-deep';
import type { CommandModule } from 'yargs';
import type { CommandArguments } from '../arguments.js';
import {
	flatAndValidateResults,
	interpolate,
	loadVariablesFromProviders,
	logger,
	normalize,
	ui,
	writeEnvFromJson,
	writeJson,
} from '../utils/index.js';

export interface ExportCommandArguments extends CommandArguments {
	format: 'dotenv' | 'json';

	uri: string;

	exportQuotes: boolean;

	overwrite: boolean;

	// whether validate schema before exporting variables
	schemaValidate: boolean;
}

/**
 * Export command.
 * Export environment variables to a file.
 *
 * @example [>_]: env export -e dev -m build
 */
export const exportCommand: CommandModule<any, ExportCommandArguments> = {
	command: 'export [options..]',
	describe: 'Export unified environment variables to a file from providers',
	builder: (builder) => {
		builder
			.options({
				exportQuotes: {
					alias: ['quotes', 'q'],
					default: false,
					describe: 'Wraps values in quotes',
					type: 'boolean',
				},
				format: {
					alias: 'f',
					choices: ['json', 'dotenv'],
					default: 'dotenv',
					describe: 'Format for export variables',
					type: 'string',
				},
				overwrite: {
					alias: 'o',
					default: true,
					describe: 'Overwrite the target file if it already exists',
					type: 'boolean',
				},
				schemaValidate: {
					alias: 'validate',
					default: true,
					describe: 'Whether validates variables using JSON schema',
					type: 'boolean',
				},
				uri: {
					alias: ['u', 'p', 'path'],
					default: '.env',
					describe: 'Uri for export file with variables',
					type: 'string',
				},
			})
			.example(
				'env export -e dev -m build',
				'Exports "dev" variables to a dotenv file at root as ".env"',
			)
			.example(
				'env export -e prod -m build -f json --uri [[env]].env.json',
				'Exports "prod" variables to a json file at root as "prod.env.json"',
			);

		return builder;
	},
	handler: async ({
		expand,
		exportIgnoreKeys,
		exportQuotes,
		providers,
		...argv
	}) => {
		const results = await loadVariablesFromProviders(providers, argv);

		let env = merge(
			{ NODE_ENV: 'development' },
			...(await flatAndValidateResults(results, argv)),
		);

		env = normalize(env, argv.nestingDelimiter, argv.arrayDescomposition);
		if (expand) env = interpolate(env, env);
		if (exportIgnoreKeys) {
			logger.silly('ignoring:', exportIgnoreKeys);
			env = Object.fromEntries(
				Object.entries(env).filter(
					([k]) => !exportIgnoreKeys.includes(k),
				),
			);
		}

		ui.variables(env);

		const { format, overwrite, uri } = argv;
		let written: boolean;

		switch (format) {
			case 'dotenv': {
				written = await writeEnvFromJson(
					uri,
					env,
					overwrite,
					exportQuotes,
				);
				break;
			}

			case 'json': {
				written = await writeJson(uri, env, overwrite);
				break;
			}

			default: {
				logger.error(`format ${format} not recognized`);

				return;
			}
		}

		if (written) {
			ui.action(
				'📤',
				`exported ${Object.keys(env).length} variables → ${uri} (${format})`,
			);
		} else {
			logger.warn(
				`file ${uri} already exists, use --overwrite for replacing it`,
			);
		}
	},
};
