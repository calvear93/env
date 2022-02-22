#!/usr/bin/env node
import yargs, { InferredOptionTypes } from 'yargs';
import { LoggerWithoutCallSite as Logger, TLogLevelName } from 'tslog';
import { args } from './arguments';
import { envCommand, pullCommand, pushCommand } from './commands';
import { readJson } from './utils/json.util';
import { interpolate, interpolateJson } from './utils/interpolate.util';

/**
 * Global stdout wrap.
 */
const logger = new Logger({
    displayDateTime: true,
    displayLoggerName: false,
    displayInstanceName: false,
    displayFunctionName: false,
    displayFilePath: 'hidden',
    dateTimePattern: 'hour:minute:second.millisecond',
    overwriteConsole: true,
    maskPlaceholder: '***',
    maskAnyRegEx: ['subcmd'],
    maskValuesOfKeys: ['env', 'subcmd', 'node', '.*.js']
});

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
        config: { delimiters }
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

    // execs yargs
    build(rawArgv.slice(2), subcommand, lib);
}

/**
 * Builds commands and execs Yargs.
 *
 * @param {string[]} rawArgv process.argv.slice(2)
 * @param {string[]} subcommand subcommand for wrap if exists
 * @param {Record<string, any>} lib package.json info
 */
function build(
    rawArgv: string[],
    subcommand: string[],
    { version, repository, config }: Record<string, any>
) {
    const builder = yargs(rawArgv)
        .strictCommands()
        .scriptName('env')
        .version(version)
        .detectLocale(false)
        .showHelpOnFail(false)
        .parserConfiguration(config.parser)
        .usage('Usage: $0 [command] [options..] [: subcmd [:]] [options..]')
        .epilog(`For more information visit ${repository}`)
        .options(args)
        .middleware((argv): void => {
            // in case of subcommand argument for main
            if (subcommand?.length > 0) argv.subcmd = subcommand;

            logger.setSettings({
                minLevel: argv.logLevel as TLogLevelName
            });

            const delimiters = config.delimiters.template;

            // loads configuration file
            if (typeof argv.configFile === 'string') {
                const path = interpolate(argv.configFile, argv, delimiters);
                const [config, success] = readJson<any>(path as string);

                if (success) {
                    Object.keys(config).forEach((key) => {
                        if (!argv[key]) argv[key] = config[key];
                    });
                } else {
                    console.warn('config file not found');
                }
            }

            // applies string templating with current vars
            interpolateJson(argv, argv, delimiters);
        }, true); // remove true forexecute after check

    // command builder
    [envCommand, pullCommand, pushCommand].forEach((cmd) =>
        builder.command(cmd as any)
    );

    // executes command processing
    builder.parse();
}

// runs the program
exec(process.argv);
