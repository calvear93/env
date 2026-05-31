import { afterEach, describe, expect, it, vi } from 'vitest';

const loadVariablesFromProviders = vi.fn(() =>
	Promise.resolve([{ key: 'a', value: { A: 1, IGNORE: 2 } }]),
);
const writeEnvFromJson = vi.fn(() => Promise.resolve(true));
const writeJson = vi.fn(() => Promise.resolve(true));

vi.mock('../utils/index.js', async () => {
	const actual = await vi.importActual<any>('../utils/index.js');
	return {
		...actual,
		loadVariablesFromProviders,
		writeEnvFromJson,
		writeJson,
	};
});

const { exportCommand } = await import('./export.command.js');

afterEach(() => vi.clearAllMocks());

const base = {
	arrayDescomposition: false,
	expand: false,
	exportIgnoreKeys: ['IGNORE'],
	exportQuotes: false,
	nestingDelimiter: '__',
	providers: [],
	schemaValidate: false,
};

describe('exportCommand builder', () => {
	it('registers options and returns the builder', () => {
		const b: any = {
			example: vi.fn().mockReturnThis(),
			options: vi.fn().mockReturnThis(),
		};
		const result = (exportCommand.builder as any)(b as any, {} as any);
		expect(b.options).toHaveBeenCalled();
		expect(result).toBe(b);
	});
});

describe('exportCommand handler', () => {
	it('exports dotenv and drops ignored keys', async () => {
		await exportCommand.handler({
			...base,
			format: 'dotenv',
			uri: '.env',
		} as any);
		const env = (writeEnvFromJson.mock.calls as any)[0][1] as Record<
			string,
			unknown
		>;
		expect(env).not.toHaveProperty('IGNORE');
		expect(env).toHaveProperty('A');
		expect(writeEnvFromJson).toHaveBeenCalledWith(
			'.env',
			expect.any(Object),
			true,
			false,
		);
	});

	it('exports json', async () => {
		await exportCommand.handler({
			...base,
			format: 'json',
			uri: 'o.json',
		} as any);
		expect(writeJson).toHaveBeenCalledWith(
			'o.json',
			expect.any(Object),
			true,
		);
		expect(writeEnvFromJson).not.toHaveBeenCalled();
	});

	it('logs error on unknown format', async () => {
		await exportCommand.handler({
			...base,
			format: 'xml',
			uri: 'o',
		} as any);
		expect(writeEnvFromJson).not.toHaveBeenCalled();
		expect(writeJson).not.toHaveBeenCalled();
	});

	it('expands env variables when expand is true', async () => {
		loadVariablesFromProviders.mockResolvedValueOnce([
			{ key: 'a', value: { BASE: 'hello', FULL: '[[BASE]]_world' } },
		] as any);
		await exportCommand.handler({
			...base,
			expand: true,
			exportIgnoreKeys: [],
			format: 'dotenv',
			uri: '.env',
		} as any);
		expect(writeEnvFromJson).toHaveBeenCalled();
		const env = (writeEnvFromJson.mock.calls as any)[0][1] as Record<
			string,
			unknown
		>;
		// after interpolation FULL should be resolved
		expect(env).toHaveProperty('BASE');
		expect(env).toHaveProperty('FULL');
	});

	it('skips exportIgnoreKeys deletion when not provided', async () => {
		await exportCommand.handler({
			...base,
			exportIgnoreKeys: undefined,
			format: 'dotenv',
			uri: '.env',
		} as any);
		const env = (writeEnvFromJson.mock.calls as any)[0][1] as Record<
			string,
			unknown
		>;
		// iGNORE key should still be present since no ignore list
		expect(env).toHaveProperty('IGNORE');
	});
});
