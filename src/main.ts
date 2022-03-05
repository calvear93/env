#!/usr/bin/env node

import chalk from 'chalk';
import { TLogLevelName } from 'tslog';
import yargsParser from 'yargs-parser';
import yargs, { Arguments, CommandModule } from 'yargs';
import { args, CommandArguments } from './arguments';
import { envCommand, pullCommand, pushCommand } from './commands';
import { interpolateJson, loadConfigFile, logger } from './utils';

type Alias = string | string[];

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

    // preload base config (ignores _ arg)
    const { _, ...preloadedArgv } = yargsParser(rawArgv, {
        configuration: parser,
        string: ['root', 'env', 'configFile', 'logLevel'],
        array: ['mode', 'logMaskAnyRegEx', 'logMaskValuesOfKeys'],
        alias: {
            env: args.env.alias as Alias,
            mode: args.mode.alias as Alias,
            configFile: args.configFile.alias as Alias,
            logLevel: args.logLevel.alias as Alias,
            logMaskAnyRegEx: args.logMaskAnyRegEx.alias as Alias,
            logMaskValuesOfKeys: args.logMaskValuesOfKeys.alias as Alias
        },
        default: {
            root: args.root.default,
            configFile: args.configFile.default,
            middleware: args.middleware.default,
            logLevel: args.logLevel.default,
            logMaskAnyRegEx: args.logMaskAnyRegEx.default,
            logMaskValuesOfKeys: args.logMaskValuesOfKeys.default
        }
    });

    // loads configuration file
    await loadConfigFile(preloadedArgv, delimiters.template);

    const {
        env,
        mode,
        middleware,
        logLevel,
        logMaskAnyRegEx,
        logMaskValuesOfKeys
    } = preloadedArgv;

    // logging level
    logger.setSettings({
        minLevel: logLevel as TLogLevelName,
        maskAnyRegEx: logMaskAnyRegEx as string[],
        maskValuesOfKeys: logMaskValuesOfKeys as string[]
    });

    if (Array.isArray(mode)) {
        logger.info(
            `loading ${chalk.bold.underline.green(
                env
            )} environment in ${chalk.bold.magenta(mode.join('+'))} mode`
        );
    }

    if (middleware) {
        // read middlewares from config
        for (const mw of middleware) {
            try {
                logger.debug(`loading ${chalk.yellow(mw.key)} middleware`);

                const { default: loader } = await import(
                    mw.key === 'default' ? './middleware' : mw.key
                );

                mw.loader = loader;
            } catch {
                logger.error(
                    `${chalk.yellow(mw.key)} middleware does not found`
                );

                process.exit(1);
            }
        }
    }

    // execs yargs
    build(rawArgv.slice(2), preloadedArgv, subcommand, lib);
}

/**
 * Builds commands and execs Yargs.
 *
 * @param {string[]} rawArgv process.argv.slice(2)
 * @param {Partial<Arguments<CommandArguments>>} preloadedArgv
 * @param {string[]} subcommand subcommand for wrap if exists
 * @param {Record<string, any>} lib package.json info
 */
function build(
    rawArgv: string[],
    preloadedArgv: Partial<Arguments<CommandArguments>>,
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
            // in case of subcommand argument for main
            if (subcommand?.length > 0) argv.subcmd = subcommand;

            // merges preloaded args
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

    // extends command from plugins
    preloadedArgv.middleware?.forEach(({ loader }) => {
        if (loader.init) loader.init(builder);
    });

    // executes command processing
    builder.parse();
}

// runs the program
exec(process.argv);
