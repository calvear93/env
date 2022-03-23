import chalk from 'chalk';
import merge from 'merge-deep';
import { CommandModule } from 'yargs';
import { CommandArguments } from '../arguments';
import {
    flatAndValidateResults,
    loadVariablesFromProviders,
    logger,
    normalize
} from '../utils';

export interface ExportCommandArguments extends CommandArguments {
    // dotenv, json
    format: string;
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
                uri: {
                    alias: ['u', 'p', 'path'],
                    type: 'string',
                    default: '.env',
                    describe: 'Uri for export file with variables'
                },
                format: {
                    alias: 'f',
                    type: 'string',
                    default: 'dotenv',
                    choices: ['json', 'dotenv'],
                    describe: 'Format for export variables'
                }
            })
            .example(
                'env export -e dev -m build',
                'Exports "dev" variables to a dotenv file at root as ".env"'
            )
            .example(
                'env export -e prod -m build -f json --uri [[env]].env.json',
                'Exports "prod" variables to a json file at root as "prod.env.json"'
            );

        return builder;
    },
    handler: async ({ providers, ...argv }) => {
        const results = await loadVariablesFromProviders(providers, argv);

        let env = merge(
            { NODE_ENV: 'development' },
            ...flatAndValidateResults(results, argv)
        );

        // results normalization merging
        env = normalize(env, argv.nestingDelimiter, argv.arrayDescomposition);

        logger.debug('environment loaded:', env);
        logger.debug('environment loaded:', argv);

        // TODO: implement
    }
};
