import type { CommandModule } from 'yargs';
import type { CommandArguments } from '../arguments.js';
import {
	generateSchemaFrom,
	loadVariablesFromProviders,
	logger,
	ui,
} from '../utils/index.js';

/**
 * Generates validation schema from providers environment variables.
 *
 * @example [>_]: env schema -e dev -m build
 */
export const schemaCommand: CommandModule<any, CommandArguments> = {
	command: 'schema [options..]',
	describe: 'Generate the JSON validation schema from providers',
	builder: (builder) => {
		return builder.example(
			'env schema --generate -e dev -m debug unit',
			'Updates JSON schema',
		);
	},
	handler: async (argv) => {
		argv.ci = true;

		const results = await loadVariablesFromProviders(argv.providers, argv);

		const schema = await generateSchemaFrom(results, argv);

		logger.silly('schema:', schema);
		ui.action('📐', `schema updated → ${argv.schemaFile}`);
	},
};
