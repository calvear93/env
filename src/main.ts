#!/usr/bin/env node

import chalk from 'chalk';
import { TLogLevelName } from 'tslog';
import yargs, { Arguments, CommandModule } from 'yargs';
import yargsParser from 'yargs-parser';
import { args } from './arguments';
import { envCommand, pullCommand, pushCommand } from './commands';
import { interpolateJson, loadConfigFile, logger } from './utils';

/**
 * Builds commands and execs Yargs.
 *
 * @param {string[]} rawArgv process.argv.slice(2)
 * @param {string[]} subcommand subcommand for wrap if exists
 * @param {Record<string, any>} lib package.json info
 */
function build(
    rawArgv: string[],
    preloadedArgv: Partial<Arguments>,
    subcommand: string[],
    { version, repository, config }: Record<string, any>
) {
    const builder = yargs(rawArgv)
        .strict()
        .scriptName('env')
        .version(version)
        .detectLocale(false)
        .showHelpOnFail(true)
        .parserConfiguration(config.parser)
        .usage('Usage: $0 [command] [options..] [: subcmd [:]] [options..]')
        .epilog(`For more information visit ${repository}`)
        .options(args)
        .middleware((argv): void => {
            if (Array.isArray(argv.mode)) {
                logger.info(
                    `loading ${chalk.bold.underline.green(
                        argv.env
                    )} environment in ${chalk.bold.magenta(
                        argv.mode.join('+')
                    )} mode`
                );
            }

            // in case of subcommand argument for main
            if (subcommand?.length > 0) {
                logger.debug(
                    'subcommand found',
                    chalk.bold.yellow(subcommand.join(' '))
                );

                argv.subcmd = subcommand;
            }

            Object.assign(argv, preloadedArgv);

            logger.debug(
                'interpolating arguments surrounded by',
                chalk.bold.yellow(
                    config.delimiters.template[0],
                    config.delimiters.template[1]
                )
            );

            // applies string templating with current vars
            interpolateJson(argv, argv, config.delimiters.template);

            logger.silly('config loaded:', argv);
        });

    // command builder
    [envCommand, pullCommand, pushCommand].forEach((cmd) =>
        builder.command(cmd as CommandModule)
    );

    // executes command processing
    builder.parse();
}

/**
 * Command preprocessing and lib info
 * reading from package.json.
 *
 * @param {string[]} rawArgv process.argv
 */
async function exec(rawArgv: string[]) {
    // reads some lib base config from package.json
    const lib = await import(`${__dirname}/package.json`);

    const {
        config: { delimiters, parser }
    } = lib;

    let subcommand: string[] = [];
    // subcommand delimiter indexes
    const begin = rawArgv.indexOf(delimiters.subcommand[0]);
    const count = rawArgv.lastIndexOf(delimiters.subcommand[1]) - begin;

    // calculates subcommand surrounded by delimiters
    if (begin > 0) {
        if (count > 0)
            subcommand = rawArgv.splice(begin, count + 1).slice(1, -1);
        else subcommand = rawArgv.splice(begin).slice(1);
    }

    // preload base config (ignores )
    const { _, ...preloadedArgv } = yargsParser(rawArgv, {
        configuration: parser,
        alias: {
            env: args.env.alias as string | string[],
            mode: args.mode.alias as string | string[],
            configFile: args.configFile.alias as string | string[]
        },
        default: {
            root: args.root.default,
            configFile: args.configFile.default
        }
    });

    // loads configuration file
    await loadConfigFile(preloadedArgv, delimiters.template);

    // logging level
    logger.setSettings({
        minLevel: preloadedArgv.logLevel as TLogLevelName,
        maskAnyRegEx: preloadedArgv.logMaskAnyRegEx as string[],
        maskValuesOfKeys: preloadedArgv.logMaskValuesOfKeys as string[]
    });

    // execs yargs
    build(rawArgv.slice(2), preloadedArgv, subcommand, lib);
}

// runs the program
exec(process.argv);
