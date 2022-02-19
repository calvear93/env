#!/usr/bin/env node
import fs from 'fs';
import yargs from 'yargs';
import { args } from './arguments';
import { defaultCommand, pullCommand, pushCommand } from './commands';
import { init } from './initialize';

async function exec() {
    // reads some base config from lib package.json
    const lib = await import(`${__dirname}\\package.json`);

    let cmd: string[];
    const cmdIndex = process.argv.indexOf(':');
    if (cmdIndex > 0) cmd = process.argv.splice(cmdIndex).slice(1);

    const builder = yargs(process.argv.slice(2))
        .scriptName('env')
        .version(lib.version)
        .detectLocale(false)
        .strict()
        .wrap(yargs.terminalWidth())
        .usage('Usage: $0 [command] [options]')
        .epilog(`For more information visit ${lib.repository}`)
        .parserConfiguration(lib.parserConfig)
        .options(args)
        .config('config', (configPath) => {
            console.log(configPath);
            console.log(fs.existsSync(configPath));
            if (!fs.existsSync(configPath)) return {};

            return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        })
        .middleware((argv) => {
            // in case of subcommand argument for main
            if (cmd) argv.cmd = cmd.join(' ');

            return argv;
        }, true)
        .check((argv) => {
            if (argv._.length === 0 && !cmd)
                throw new Error('No one subcommand provided for exec after :');

            init(argv.root);

            return true;
        });

    // command builder
    [defaultCommand, pullCommand, pushCommand].forEach((cmd) =>
        builder.command(cmd)
    );

    // executes command processing
    builder.parse();
}

exec();
