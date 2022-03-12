import merge from 'merge-deep';
import { CommandModule } from 'yargs';
import { CommandArguments } from '../arguments';
import {
    loadVariablesFromProviders,
    logger,
    schemaFrom,
    writeJson
} from '../utils';

export interface SchemaCommandArguments extends CommandArguments {
    resolve: 'merge' | 'override';
    nullable: boolean;
    detectFormat: boolean;
}

export const schemaCommand: CommandModule<any, SchemaCommandArguments> = {
    command: 'schema [options..]',
    describe: 'Handles environment variables JSON schema',
    builder: (builder) => {
        builder
            .options({
                resolve: {
                    alias: 'r',
                    type: 'string',
                    default: 'merge',
                    choices: ['merge', 'override'],
                    describe: 'Generates a JSON schema from variables'
                },
                nullable: {
                    alias: 'null',
                    type: 'boolean',
                    default: true,
                    describe: 'Whether variables are nullable'
                },
                detectFormat: {
                    alias: 'df',
                    type: 'boolean',
                    default: true,
                    describe:
                        'Whether format of strings variables are included in schema'
                }
            })
            .example(
                'env schema --generate -e dev -m debug unit',
                'Updates JSON schema'
            );

        return builder;
    },
    handler: async ({
        providers,
        resolve,
        nullable,
        detectFormat,
        ...argv
    }) => {
        const results = await loadVariablesFromProviders(providers, argv);
        const env = merge({}, ...results.flatMap((loader) => loader.result));

        logger.silly('environment loaded:', env);

        let schema = schemaFrom(env, { nullable, strings: { detectFormat } });
        if (resolve === 'merge') schema = merge(argv.schema, schema);

        await writeJson(argv.schemaFile, schema, true);

        logger.silly('schema:', schema);
        logger.info('schema updated successfully');
    }
};
