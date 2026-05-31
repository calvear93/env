/**
 * Recombines argv tokens so single-quoted, space-containing argument values
 * survive shell splitting. Mirrors the original main.ts pre-processing as a
 * pure, testable function.
 *
 * @param argv raw process.argv
 * @returns normalized argv (already sliced past node + script path)
 */
export function normalizeRawArgv(argv: string[]): string[] {
	const cmdArgs: string[] = [];
	let composite = '';

	for (let arg of argv) {
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

	return cmdArgs.slice(2);
}
