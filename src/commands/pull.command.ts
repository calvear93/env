import chalk from 'chalk';
import { CommandModule } from 'yargs';
import { CommandArguments } from '../arguments';
import { logger } from '../utils';

export interface PullCommandArguments extends CommandArguments {
    overwrite: boolean;
}

export const pullCommand: CommandModule<any, PullCommandArguments> = {
    command: 'pull [options..]',
    describe: 'Pulls secrets from providers',
    builder: (builder) => {
        builder
            .options({
                overwrite: {
                    alias: 'o',
                    type: 'boolean',
                    default: false,
                    describe: 'Overwrite local variables'
                }
            })
            .example('env pull -e dev', 'Download "dev" environment secrets')
            .example(
                'env pull -e dev -o',
                'Download and overwrite (if any exists) "dev" environment secrets'
            );

        return builder;
    },
    handler: async ({ providers, ...argv }) => {
        const promises = await Promise.all(
            providers
                .filter(({ handler: { pull } }) => !!pull)
                .map(({ handler: { key, pull }, config }) => {
                    logger.silly(`pulling from ${chalk.yellow(key)} provider`);

                    return pull!(argv, config);
                })
        );

        if (promises.length > 0)
            logger.info('environment variables pulled successfully');
        else logger.warn('no providers for pull variables');
    }
};
