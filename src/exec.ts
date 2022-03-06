#!/usr/bin/env node

import chalk from 'chalk';
import { TLogLevelName } from 'tslog';
import yargsParser from 'yargs-parser';
import yargs, { Arguments, CommandModule } from 'yargs';
import { args, CommandArguments } from './arguments';
import { envCommand, pullCommand, pushCommand } from './commands';
import {
    getSubcommand,
    interpolateJson,
    loadConfigFile,
    logger
} from './utils';

type Alias = string | string[];

/**
 * Command preprocessing and lib info
 * reading from package.json.
 * Preloads config file and setup basic config.
 *
 * @param {string[]} rawArgv process.argv
 */
export async function exec(rawArgv: string[]) {
    // reads some lib base config from package.json
    const { config, version } = await import(`${__dirname}/package.json`);

    const preloadedArgv = await preloadConfig(
        rawArgv,
        config.parser,
        config.delimiters.template
    );

    const {
        env,
        mode,
        loaders,
        logLevel,
        logMaskAnyRegEx,
        logMaskValuesOfKeys
    } = preloadedArgv;

    if (!Array.isArray(mode) || !loaders) throw new Error('Bad arguments');

    // logging level
    logger.setSettings({
        minLevel: logLevel as TLogLevelName,
        maskAnyRegEx: logMaskAnyRegEx as string[],
        maskValuesOfKeys: logMaskValuesOfKeys as string[]
    });

    logger.info(
        `loading ${chalk.bold.underline.green(
            env
        )} environment in ${chalk.bold.magenta(mode.join('+'))} mode`
    );

    // read loaders from config
    for (const loader of loaders) {
        try {
            logger.debug(`loading ${chalk.yellow(loader.key)} provider`);

            const { default: module } = await import(
                loader.key === 'default' ? './loader' : loader.key
            );

            loader.provider = module;
        } catch {
            logger.error(
                `${chalk.yellow(loader.key)} middleware does not found`
            );

            process.exit(1);
        }
    }

    // execs yargs
    const subcommand = getSubcommand(rawArgv, config.delimiters.subcommand);

    build(rawArgv.slice(2), preloadedArgv, subcommand, config, version);
}

/**
 * Preload basic config from command line and config file.
 *
 * @param {string[]} rawArgv process.argv
 * @param {Partial<yargsParser.Configuration>} parser yargs parser config
 * @param {[string, string]} delimiters
 *
 * @returns {Promise<Partial<CommandArguments>>} preloaded config
 */
async function preloadConfig(
    rawArgv: string[],
    parser: Partial<yargsParser.Configuration>,
    delimiters: [string, string]
): Promise<Partial<CommandArguments>> {
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
            loaders: args.loaders.default,
            logLevel: args.logLevel.default,
            logMaskAnyRegEx: args.logMaskAnyRegEx.default,
            logMaskValuesOfKeys: args.logMaskValuesOfKeys.default
        }
    });

    // loads configuration file
    await loadConfigFile(preloadedArgv, delimiters);

    return preloadedArgv;
}

/**
 * Builds commands and execs Yargs.
 *
 * @param {string[]} rawArgv process.argv.slice(2)
 * @param {Partial<Arguments<CommandArguments>>} preloadedArgv
 * @param {string[]} subcommand subcommand for wrap if exists
 * @param {Record<string, any>} config lib config from package.json
 * @param {string} version lib version from package.json
 */
function build(
    rawArgv: string[],
    preloadedArgv: Partial<Arguments<CommandArguments>>,
    subcommand: string[],
    config: Record<string, any>,
    version = 'unknown'
): void {
    const builder = yargs(rawArgv)
        .strict()
        .scriptName('env')
        .version(version)
        .detectLocale(false)
        .showHelpOnFail(true)
        .parserConfiguration(config.parser)
        .usage('Usage: $0 [command] [options..] [: subcmd [:]] [options..]')
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
    preloadedArgv.loaders?.forEach(({ provider }) => {
        provider.builder && provider.builder(builder);
    });

    // executes command processing
    builder.parse();
}
