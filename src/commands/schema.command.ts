import { CommandModule } from 'yargs';
import { CommandArguments } from '../arguments';
import {
    generateSchemaFrom,
    loadVariablesFromProviders,
    logger
} from '../utils';

export const schemaCommand: CommandModule<any, CommandArguments> = {
    command: 'schema [options..]',
    describe: 'Handles environment variables JSON schema',
    builder: (builder) => {
        return builder.example(
            'env schema --generate -e dev -m debug unit',
            'Updates JSON schema'
        );
    },
    handler: async (argv) => {
        const results = await loadVariablesFromProviders(argv.providers, argv);

        const schema = await generateSchemaFrom(results, argv);

        logger.silly('schema:', schema);
        logger.info('schema updated successfully');
    }
};
