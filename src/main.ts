#!/usr/bin/env node

import { exec } from './exec';

const argv = process.argv;
const cmdArgs = [];
let composite = '';

for (let i = 0; i < argv.length; i++) {
	let arg = argv[i];

	if (arg.includes(' ')) arg = `"${arg}"`;

	if (arg.at(-1) === "'") {
		cmdArgs.push(`${composite} ${arg}`.replaceAll("'", '"'));
		composite = '';
		continue;
	}

	if (arg[0] === "'") {
		composite += arg;
		continue;
	}

	if (composite) {
		composite += ` ${arg}`;
		continue;
	}

	cmdArgs.push(arg);
}

// runs the program
exec(cmdArgs.slice(2));
