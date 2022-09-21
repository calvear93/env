#!/usr/bin/env node

import chalk from 'chalk';
import yargsParser from 'yargs-parser';
import yargs, { Arguments } from 'yargs';
import { IntegratedProviders } from './providers';
import { args, CommandArguments } from './arguments';
import {
    envCommand,
    exportCommand,
    pullCommand,
    pushCommand,
    schemaCommand
} from './commands';
import {
    getSubcommand,
    interpolateJson,
    loadConfigFile,
    loadProjectInfo,
    loadSchemaFile,
    logger,
    resolvePath
} from './utils';

type Alias = string | string[];

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
        boolean: ['help'],
        string: ['root', 'env', 'configFile', 'schemaFile', 'logLevel'],
        array: ['modes', 'logMaskAnyRegEx', 'logMaskValuesOfKeys'],
        alias: {
            env: args.env.alias as Alias,
            modes: args.modes.alias as Alias,
            configFile: args.configFile.alias as Alias,
            logLevel: args.logLevel.alias as Alias,
            logMaskAnyRegEx: args.logMaskAnyRegEx.alias as Alias,
            logMaskValuesOfKeys: args.logMaskValuesOfKeys.alias as Alias
        },
        default: {
            root: args.root.default,
            configFile: args.configFile.default
        }
    });

    // loads configuration file
    await loadConfigFile(preloadedArgv, delimiters);

    preloadedArgv.logLevel ??= args.logLevel.default;
    preloadedArgv.logMaskAnyRegEx ??= args.logMaskAnyRegEx.default;
    preloadedArgv.logMaskValuesOfKeys ??= args.logMaskValuesOfKeys.default;
    preloadedArgv.providers ??= args.providers.default;

    const { logLevel, logMaskAnyRegEx, logMaskValuesOfKeys } = preloadedArgv;

    // logging level
    logger.setSettings({
        minLevel: logLevel,
        maskAnyRegEx: logMaskAnyRegEx,
        maskValuesOfKeys: logMaskValuesOfKeys
    });

    return preloadedArgv;
}

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

    const { env, modes, providers, help } = preloadedArgv;

    if (help) build(rawArgv, preloadedArgv, subcommand, config, version);

    if (!Array.isArray(providers) || providers.length === 0) {
        logger.error('no providers found');

        throw new Error('no providers found');
    }

    const envMsg = env ? ` ${chalk.bold.underline.green(env)} environment` : '';
    const modesMsg = modes
        ? ` ${chalk.bold.magenta(modes.join('+'))} mode`
        : '';

    logger.info(`loading${envMsg}${env && modes ? ' in' : ''}${modesMsg}`);

    // read loaders from config
    for (const provider of providers!) {
        try {
            logger.debug(`using ${chalk.yellow(provider.path)} provider`);

            if (!provider.type || provider.type === 'integrated') {
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
                `${chalk.yellow(
                    provider.path
                )} provider not found or not compatible`
            );

            throw new Error(
                `${provider.path} provider not found or not compatible`
            );
        }
    }

    build(rawArgv, preloadedArgv, subcommand, config, version);
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
        .showHelpOnFail(false)
        .parserConfiguration(config.parser)
        .usage('Usage: $0 [command] [options..] [: subcmd [:]] [options..]')
        .options(args)
        .middleware(async (argv): Promise<void> => {
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

            // loads environment JSON schema if exists
            // and current project info from package.json
            [argv.app, argv.schema] = await Promise.all([
                loadProjectInfo(),
                loadSchemaFile(argv, config.delimiters.template)
            ]);

            if (argv.schemaValidate) {
                argv.schemaValidate = !!argv.schema;

                if (argv.schemaValidate)
                    logger.silly('schema loaded:', argv.schema);
            }
        });

    // integrated commands builder
    builder.command(envCommand);
    builder.command(exportCommand);
    builder.command(pullCommand);
    builder.command(pushCommand);
    builder.command(schemaCommand);

    const { providers } = preloadedArgv;

    // extends command from plugins
    for (const { handler } of providers!)
        handler?.builder && handler.builder(builder);

    // executes command processing
    builder.parse();
}
