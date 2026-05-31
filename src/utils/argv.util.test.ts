import { describe, expect, it } from 'vitest';
import { normalizeRawArgv } from './argv.util.js';

describe('normalizeRawArgv', () => {
	// plain path: node + script sliced off, plain args pass through
	it('passes through plain args (slicing node + script)', () => {
		expect(normalizeRawArgv(['node', 'script.js', '-e', 'dev'])).toEqual([
			'-e',
			'dev',
		]);
	});

	it('returns empty array when only node + script are present', () => {
		expect(normalizeRawArgv(['node', 'script.js'])).toEqual([]);
	});

	// space branch: arg.includes(' ') → wrap in double-quotes
	it('wraps args that contain spaces in double-quotes', () => {
		expect(normalizeRawArgv(['node', 's', 'hello world'])).toEqual([
			'"hello world"',
		]);
	});

	it('wraps multiple space-containing args independently', () => {
		expect(normalizeRawArgv(['node', 's', 'a b', 'c d'])).toEqual([
			'"a b"',
			'"c d"',
		]);
	});

	// composite recombination: tokens wrapped in single-quotes
	// opening token: arg[0] === "'"  → starts composite
	// middle token:  composite is truthy, no leading/trailing quote → appended
	// closing token: arg.at(-1) === "'" → pushes composite with double-quotes
	it('recombines single-quoted composite tokens (opening + middle + closing)', () => {
		expect(
			normalizeRawArgv(['node', 's', "'npm", 'run', "build'"]),
		).toEqual(['"npm run build"']);
	});

	it('recombines single-quoted composite with only opening + closing tokens', () => {
		// "'foo'" has both first char = "'" and last char = "'"
		// arg[0] === "'" is checked AFTER arg.at(-1) === "'"
		// so "closing" check fires first → pushes `${composite} 'foo'` with quotes replaced
		// composite is '', so result is ' "foo"'... let's verify actual behaviour
		const result = normalizeRawArgv(['node', 's', "'foo'"]);
		// 'foo': arg.at(-1) === "'" → pushes `${''} 'foo'`.replaceAll("'", '"') = ' "foo"'
		expect(result).toEqual([' "foo"']);
	});

	it('recombines two separate single-quote groups', () => {
		expect(
			normalizeRawArgv([
				'node',
				's',
				"'npm",
				'install',
				"pkg'",
				"'node",
				'run',
				"test'",
			]),
		).toEqual(['"npm install pkg"', '"node run test"']);
	});

	// middle accumulation branch: composite is truthy, arg doesn't start/end with quote
	it('accumulates middle tokens while composite is open', () => {
		expect(normalizeRawArgv(['node', 's', "'a", 'b', 'c', "d'"])).toEqual([
			'"a b c d"',
		]);
	});

	// plain push branch: no space, not single-quote, composite empty
	it('pushes plain args while composite is empty', () => {
		expect(normalizeRawArgv(['node', 's', 'foo', 'bar', 'baz'])).toEqual([
			'foo',
			'bar',
			'baz',
		]);
	});

	// mixed scenario
	it('handles mix of plain args and composite tokens', () => {
		expect(
			normalizeRawArgv([
				'node',
				's',
				'-e',
				'dev',
				"'npm",
				'run',
				"build'",
			]),
		).toEqual(['-e', 'dev', '"npm run build"']);
	});
});
