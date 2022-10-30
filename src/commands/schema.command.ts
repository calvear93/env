import { CommandModule } from 'yargs';
import { CommandArguments } from '../arguments';
import {
	generateSchemaFrom,
	loadVariablesFromProviders,
	logger
} from '../utils';

/**
 * Generates validation schema from providers environment variables.
 *
 * @example [>_]: env schema -e dev -m build
 */
export const schemaCommand: CommandModule<any, CommandArguments> = {
	command: 'schema [options..]',
	describe: 'Generates validation schema from providers',
	builder: (builder) => {
		return builder.example(
			'env schema --generate -e dev -m debug unit',
			'Updates JSON schema'
		);
	},
	handler: async (argv) => {
		argv.ci = true;

		const results = await loadVariablesFromProviders(argv.providers, argv);

		const schema = await generateSchemaFrom(results, argv);

		logger.silly('schema:', schema);
		logger.info('schema updated successfully');
	}
};
