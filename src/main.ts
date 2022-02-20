#!/usr/bin/env node
import fs from 'fs';
import yargs, { CommandModule } from 'yargs';
import { subslate } from 'subslate';
import { args, CommandArguments } from './arguments';
import { prepare } from './prepare';
import { envCommand, pullCommand, pushCommand } from './commands';

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
        .scriptName('env')
        .version(version)
        .detectLocale(false)
        .strict()
        .wrap(yargs.terminalWidth())
        .usage('Usage: $0 [command] [options..] [: subcmd [:]] [options..]')
        .epilog(`For more information visit ${repository}`)
        .parserConfiguration(config.parser)
        .options(args)
        .config('config', (configPath) => {
            if (!fs.existsSync(configPath)) return {};

            return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        })
        .middleware((argv) => {
            // in case of subcommand argument for main
            if (subcommand) argv.subcmd = subcommand;

            // applies string templating with current vars
            Object.keys(argv).forEach((key) => {
                const arg = argv[key];

                if (typeof arg === 'string') {
                    argv[key] = subslate(arg, argv, {
                        startStopPairs: config.delimiters.template
                    });
                } else if (Array.isArray(arg)) {
                    argv[key] = arg.map((a) =>
                        subslate(a, argv, {
                            startStopPairs: config.delimiters.template
                        })
                    );
                }
            });

            return argv;
        }, true)
        .check((argv) => {
            if (argv._.length === 0 && !subcommand)
                throw new Error('No one subcommand provided for exec after :');

            prepare(argv.root as string);

            return true;
        });

    // command builder
    [envCommand, pullCommand, pushCommand].forEach((cmd) =>
        builder.command(cmd as any)
    );

    // executes command processing
    builder.parse();
}

// runs the program
exec(process.argv);
