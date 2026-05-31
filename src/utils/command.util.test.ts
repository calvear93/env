import { afterEach, describe, expect, it, vi } from 'vitest';

const readJson = vi.fn();
const writeJson = vi.fn(() => Promise.resolve(true));
vi.mock('./json.util.js', async () => {
	const actual = await vi.importActual<any>('./json.util.js');
	return { ...actual, readJson, writeJson };
});

const cmd = await import('./command.util.js');
afterEach(() => vi.clearAllMocks());

// ---------------------------------------------------------------------------
// getSubcommand
// ---------------------------------------------------------------------------
describe('getSubcommand', () => {
	it('returns [] when there is no begin delimiter', () => {
		expect(cmd.getSubcommand(['a', 'b'], [':', ':'])).toEqual([]);
	});
	it('extracts a single-delimiter tail (begin found, no end after)', () => {
		const raw = ['env', '-e', 'dev', ':', 'node', 'x'];
		expect(cmd.getSubcommand(raw, [':', ':'])).toEqual(['node', 'x']);
	});
	it('extracts a surrounded subcommand (begin and end delimiters present)', () => {
		const raw = ['env', ':', 'node', 'x', ':', '-m', 'd'];
		expect(cmd.getSubcommand(raw, [':', ':'])).toEqual(['node', 'x']);
	});
});

// ---------------------------------------------------------------------------
// loadConfigFile
// ---------------------------------------------------------------------------
describe('loadConfigFile', () => {
	it('injects defaults from file without overriding existing values', async () => {
		readJson.mockResolvedValue([{ a: 1, b: 2 }, true]);
		const argv: any = { a: 9, configFile: 'c.json' };
		await cmd.loadConfigFile(argv, ['[[', ']]']);
		expect(argv).toMatchObject({ a: 9, b: 2 });
	});
	it('does nothing when configFile is not a string', async () => {
		const argv: any = {};
		await cmd.loadConfigFile(argv, ['[[', ']]']);
		expect(readJson).not.toHaveBeenCalled();
	});
	it('does not set any keys when file is not found', async () => {
		readJson.mockResolvedValue([{}, false]);
		const argv: any = { configFile: 'missing.json' };
		await cmd.loadConfigFile(argv, ['[[', ']]']);
		// success=false so no keys injected
		expect(Object.keys(argv)).toEqual(['configFile']);
	});
});

// ---------------------------------------------------------------------------
// loadSchemaFile
// ---------------------------------------------------------------------------
describe('loadSchemaFile', () => {
	it('returns undefined when schemaFile is not a string', async () => {
		const result = await cmd.loadSchemaFile({}, ['[[', ']]']);
		expect(result).toBeUndefined();
	});
	it('returns the schema when file is found', async () => {
		readJson.mockResolvedValue([{ a: { type: 'object' } }, true]);
		const result = await cmd.loadSchemaFile(
			{ schemaFile: 'tests/env/settings/schema.json' },
			['[[', ']]'],
		);
		expect(result).toEqual({ a: { type: 'object' } });
	});
	it('returns undefined when schemaFile is a string but file is missing', async () => {
		readJson.mockResolvedValue([{}, false]);
		const result = await cmd.loadSchemaFile(
			{ schemaFile: 'nonexistent.json' },
			['[[', ']]'],
		);
		expect(result).toBeUndefined();
	});
});

// ---------------------------------------------------------------------------
// loadProjectInfo
// ---------------------------------------------------------------------------
describe('loadProjectInfo', () => {
	it('returns package.json content when the file exists (cwd)', async () => {
		// process.cwd() is the repo root which has a package.json
		const info = await cmd.loadProjectInfo('');
		expect(info).toHaveProperty('name');
	});
	it('returns {} when package.json cannot be found (catch path)', async () => {
		const result = await cmd.loadProjectInfo('does/not/exist');
		expect(result).toEqual({});
	});
});

// ---------------------------------------------------------------------------
// loadVariablesFromProviders
// ---------------------------------------------------------------------------
describe('loadVariablesFromProviders', () => {
	it('returns [] for falsy providers', async () => {
		expect(
			await cmd.loadVariablesFromProviders(undefined as any, {}),
		).toEqual([]);
	});
	it('wraps sync provider results', async () => {
		const providers: any = [
			{ handler: { key: 'a', load: () => ({ X: 1 }) } },
		];
		const out = await cmd.loadVariablesFromProviders(providers, {});
		expect(out).toEqual([{ config: undefined, key: 'a', value: { X: 1 } }]);
	});
	it('wraps async provider results', async () => {
		const providers: any = [
			{ handler: { key: 'b', load: () => Promise.resolve({ Y: 2 }) } },
		];
		const out = await cmd.loadVariablesFromProviders(providers, {});
		expect(out).toEqual([{ config: undefined, key: 'b', value: { Y: 2 } }]);
	});
	it('passes config from provider config field', async () => {
		const providers: any = [
			{ config: { k: 'v' }, handler: { key: 'c', load: () => ({}) } },
		];
		const out = await cmd.loadVariablesFromProviders(providers, {});
		expect(out[0].config).toEqual({ k: 'v' });
	});
});

// ---------------------------------------------------------------------------
// flatResults
// ---------------------------------------------------------------------------
describe('flatResults', () => {
	it('flattens an object value', () => {
		const out = cmd.flatResults([
			{ key: 'a', value: { g: { v: 1 } } },
		] as any);
		expect(out).toEqual([{ g__v: 1 }]);
	});
	it('merges and flattens an array value', () => {
		const out = cmd.flatResults([
			{ key: 'b', value: [{ x: 1 }, { y: 2 }] },
		] as any);
		expect(out).toEqual([{ x: 1, y: 2 }]);
	});
});

// ---------------------------------------------------------------------------
// flatAndValidateResults
// ---------------------------------------------------------------------------
describe('flatAndValidateResults', () => {
	it('returns flat results when schemaValidate is off', async () => {
		const out = await cmd.flatAndValidateResults(
			[{ key: 'a', value: { x: 1 } }] as any,
			{ schemaValidate: false } as any,
		);
		expect(out).toEqual([{ x: 1 }]);
	});
	it('passes when validation succeeds', async () => {
		const out = await cmd.flatAndValidateResults(
			[{ key: 'a', value: { x: 1 } }] as any,
			{
				schemaValidate: true,
				schema: {
					a: {
						properties: { x: { type: 'number' } },
						type: 'object',
					},
				},
			} as any,
		);
		expect(out).toEqual([{ x: 1 }]);
	});
	it('returns baseValue when no validator exists for the key', async () => {
		const out = await cmd.flatAndValidateResults(
			[{ key: 'unknown', value: { z: 1 } }] as any,
			{
				schema: { other: { type: 'object' } },
				schemaValidate: true,
			} as any,
		);
		expect(out).toEqual([{ z: 1 }]);
	});
	it('throws on validation failure', async () => {
		await expect(
			cmd.flatAndValidateResults(
				[{ key: 'a', value: { x: 'str' } }] as any,
				{
					schemaValidate: true,
					schema: {
						a: {
							properties: { x: { type: 'number' } },
							type: 'object',
						},
					},
				} as any,
			),
		).rejects.toThrow(/schema validation failed/);
	});
	it('handles array value with schemaValidate on', async () => {
		// array value path: merges and flattens
		const out = await cmd.flatAndValidateResults(
			[{ key: 'a', value: [{ x: 1 }, { y: 2 }] }] as any,
			{
				schemaValidate: true,
				schema: {
					a: {
						type: 'object',
						properties: {
							x: { type: 'number' },
							y: { type: 'number' },
						},
					},
				},
			} as any,
		);
		expect(out).toEqual([{ x: 1, y: 2 }]);
	});
});

// ---------------------------------------------------------------------------
// generateSchemaFrom
// ---------------------------------------------------------------------------
describe('generateSchemaFrom', () => {
	it('generates schema with merge resolve and writes it', async () => {
		writeJson.mockResolvedValue(true);
		const schema = await cmd.generateSchemaFrom(
			[{ key: 'a', value: { x: 1 } }] as any,
			{
				detectFormat: false,
				nullable: true,
				resolve: 'merge',
				schema: {},
				schemaFile: 's.json',
			} as any,
		);
		expect(schema).toHaveProperty('a');
		expect(writeJson).toHaveBeenCalled();
	});
	it('generates schema with override resolve (no merge)', async () => {
		writeJson.mockResolvedValue(true);
		const schema = await cmd.generateSchemaFrom(
			[{ key: 'b', value: { y: 2 } }] as any,
			{
				detectFormat: false,
				nullable: false,
				resolve: 'override',
				schema: {},
				schemaFile: 's.json',
			} as any,
		);
		expect(schema).toHaveProperty('b');
		expect(writeJson).toHaveBeenCalled();
	});
	it('handles array provider value by merging before schema generation', async () => {
		writeJson.mockResolvedValue(true);
		const schema = await cmd.generateSchemaFrom(
			[{ key: 'c', value: [{ a: 1 }, { b: 2 }] }] as any,
			{
				detectFormat: false,
				nullable: false,
				resolve: 'override',
				schema: {},
				schemaFile: 's.json',
			} as any,
		);
		expect(schema).toHaveProperty('c');
	});
});
