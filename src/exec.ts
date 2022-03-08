#!/usr/bin/env node

import chalk from 'chalk';
import { TLogLevelName } from 'tslog';
import yargsParser from 'yargs-parser';
import yargs, { Arguments } from 'yargs';
import { IntegratedProviders } from './providers';
import { args, CommandArguments } from './arguments';
import { envCommand, pullCommand, pushCommand } from './commands';
import {
    getSubcommand,
    interpolateJson,
    loadConfigFile,
    logger,
    resolvePath
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

    // execs yargs
    const subcommand = getSubcommand(rawArgv, config.delimiters.subcommand);

    const preloadedArgv = await preloadConfig(
        rawArgv,
        config.parser,
        config.delimiters.template
    );

    const {
        env,
        mode,
        providers,
        logLevel,
        logMaskAnyRegEx,
        logMaskValuesOfKeys
    } = preloadedArgv;

    if (!providers) throw new Error('"providers" must be well defined');

    // logging level
    logger.setSettings({
        minLevel: logLevel as TLogLevelName,
        maskAnyRegEx: logMaskAnyRegEx as string[],
        maskValuesOfKeys: logMaskValuesOfKeys as string[]
    });

    logger.info(
        `loading ${chalk.bold.underline.green(
            env
        )} environment in ${chalk.bold.magenta(mode?.join('+'))} mode`
    );

    // read loaders from config
    for (const provider of providers) {
        try {
            logger.debug(`loading ${chalk.yellow(provider.path)} provider`);

            if (provider.type === 'integrated') {
                provider.handler = IntegratedProviders[provider.path];
            } else {
                const { default: module } = await import(
                    provider.type === 'module'
                        ? provider.path
                        : resolvePath(provider.path)
                );

                provider.handler = module;
            }
        } catch {
            logger.error(
                `${chalk.yellow(provider.path)} provider does not found`
            );

            process.exit(1);
        }
    }

    build(rawArgv, preloadedArgv, subcommand, config, version);
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
    // preload base config
    const preloadedArgv = yargsParser(rawArgv, {
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
            providers: args.providers.default,
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

            logger.silly(
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

    // integrated commands builder
    builder.command(envCommand);
    builder.command(pullCommand);
    builder.command(pushCommand);

    // extends command from plugins
    preloadedArgv.providers?.forEach(({ handler }) => {
        handler.builder && handler.builder(builder);
    });

    // executes command processing
    builder.parse();
}
