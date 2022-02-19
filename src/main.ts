#!/usr/bin/env node
import yargs from 'yargs';
import { args } from './arguments';
import { defaultCommand, pullCommand, pushCommand } from './commands';
import { init } from './initialize';

async function exec() {
    // reads some base config from lib package.json
    const lib = await import(`${__dirname}\\package.json`);

    const builder = yargs(process.argv.slice(2))
        .scriptName('env')
        .version(lib.version)
        .locale('en')
        .strict()
        .usage('Usage: $0 [command] [options] [run]')
        .epilog(`For more information visit ${lib.repository}`)
        .parserConfiguration(lib.parserConfig)
        .options(args)
        .check((argv) => {
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
