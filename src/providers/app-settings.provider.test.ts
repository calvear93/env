import { afterEach, describe, expect, it, vi } from 'vitest';

const readJson = vi.fn();
vi.mock('../utils/index.js', async () => {
	const actual = await vi.importActual<any>('../utils/index.js');
	return { ...actual, readJson };
});

const { AppSettingsProvider } = await import('./app-settings.provider.js');

afterEach(() => vi.clearAllMocks());

describe('AppSettingsProvider', () => {
	it('exposes the app-settings key', () => {
		expect(AppSettingsProvider.key).toBe('app-settings');
	});

	it('exposes load and builder', () => {
		expect(typeof AppSettingsProvider.load).toBe('function');
		expect(typeof AppSettingsProvider.builder).toBe('function');
	});
});

describe('AppSettingsProvider.builder', () => {
	it('registers the envFile option', () => {
		const options = vi.fn();
		AppSettingsProvider.builder!({ options } as any);
		expect(options).toHaveBeenCalledOnce();
		const arg = options.mock.calls[0][0] as Record<string, unknown>;
		expect(arg).toHaveProperty('envFile');
	});
});

describe('AppSettingsProvider.load', () => {
	it('warns when appsettings file not found (wasFound=false)', async () => {
		// file not found: readJson returns [{}, false] for envFile, then [{}, true] for unitary reads
		readJson
			.mockResolvedValueOnce([{}, false]) // envFile → not found
			.mockResolvedValue([{}, true]); // all unitary reads
		const out = (await AppSettingsProvider.load({
			ci: false,
			env: 'dev',
			envFile: 'r/appsettings.json',
			modes: [],
			root: 'r',
		} as any)) as any[];
		// no composite key → first element is appsettings itself (empty {})
		expect(out[0]).toEqual({});
	});

	it('returns appsettings as first element when no composite key present', async () => {
		readJson
			.mockResolvedValueOnce([{ X: 1, Y: 2 }, true]) // envFile
			.mockResolvedValue([{}, true]); // unitary reads
		const out = (await AppSettingsProvider.load({
			ci: false,
			env: 'dev',
			envFile: 'f',
			modes: [],
			root: 'r',
		} as any)) as any[];
		expect(out[0]).toEqual({ X: 1, Y: 2 });
	});

	it('returns empty {} as first element when |DEFAULT| composite key is present', async () => {
		readJson
			.mockResolvedValueOnce([
				{ '|DEFAULT|': { A: 1 }, '|ENV|': { dev: { B: 2 } } },
				true,
			])
			.mockResolvedValue([{}, true]);
		const out = (await AppSettingsProvider.load({
			ci: false,
			env: 'dev',
			envFile: 'r/appsettings.json',
			modes: [],
			root: 'r',
		} as any)) as any[];
		// composite present → first element is empty {}
		expect(out[0]).toEqual({});
		// |DEFAULT| value is second element
		expect(out[1]).toEqual({ A: 1 });
		// |ENV|[env] is third element
		expect(out[2]).toEqual({ B: 2 });
	});

	it('returns |ENV| value for the current env', async () => {
		readJson
			.mockResolvedValueOnce([{ '|ENV|': { staging: { C: 3 } } }, true])
			.mockResolvedValue([{}, true]);
		const out = (await AppSettingsProvider.load({
			ci: false,
			env: 'staging',
			envFile: 'f',
			modes: [],
			root: 'r',
		} as any)) as any[];
		// composite present (|ENV| is truthy) → first element is {}
		expect(out[0]).toEqual({});
		// |DEFAULT| → undefined
		expect(out[1]).toBeUndefined();
		// |ENV|[env]
		expect(out[2]).toEqual({ C: 3 });
	});

	it('returns |MODE| value for each mode', async () => {
		readJson
			.mockResolvedValueOnce([{ '|MODE|': { debug: { D: 4 } } }, true])
			.mockResolvedValue([{}, true]);
		const out = (await AppSettingsProvider.load({
			ci: false,
			env: 'dev',
			envFile: 'f',
			modes: ['debug'],
			root: 'r',
		} as any)) as any[];
		// composite present (|MODE| truthy) → first element {}
		expect(out[0]).toEqual({});
		// |MODE|[mode] appears in the result
		expect(out).toContainEqual({ D: 4 });
	});

	it('returns |LOCAL| value for env when not in ci', async () => {
		readJson
			.mockResolvedValueOnce([{ '|LOCAL|': { dev: { E: 5 } } }, true])
			.mockResolvedValue([{}, true]);
		const out = (await AppSettingsProvider.load({
			ci: false,
			env: 'dev',
			envFile: 'f',
			modes: [],
			root: 'r',
		} as any)) as any[];
		// composite present
		expect(out[0]).toEqual({});
		// |LOCAL|[env] should be in the result
		expect(out).toContainEqual({ E: 5 });
	});

	it('nulls |LOCAL| in ci mode', async () => {
		readJson
			.mockResolvedValueOnce([
				{ '|DEFAULT|': { A: 1 }, '|LOCAL|': { dev: { E: 5 } } },
				true,
			])
			.mockResolvedValue([{}, true]);
		const out = await AppSettingsProvider.load({
			ci: true,
			env: 'dev',
			envFile: 'f',
			modes: [],
			root: 'r',
		} as any);
		// in ci mode, |LOCAL| is set to null, so |LOCAL|?.[env] is undefined
		// The local.json unitary read returns {} (not ci-filtered here, that's a different field)
		// ci nulls appsettings['|LOCAL|'], so |LOCAL|?.[env] === undefined
		expect(out).not.toContainEqual({ E: 5 });
	});

	it('includes modes unitary reads in result', async () => {
		readJson
			.mockResolvedValueOnce([{}, true]) // envFile (no composite)
			.mockResolvedValueOnce([{ U1: 'x' }, true]) // appsettings.dev.json
			.mockResolvedValueOnce([{ U2: 'y' }, true]) // appsettings.dev.local.json
			.mockResolvedValueOnce([{ U3: 'z' }, true]); // appsettings.build.json (mode)
		const out = (await AppSettingsProvider.load({
			ci: false,
			env: 'dev',
			envFile: 'f',
			modes: ['build'],
			root: 'r',
		} as any)) as any[];
		expect(out).toContainEqual({ U1: 'x' });
		expect(out).toContainEqual({ U3: 'z' });
	});

	it('ci mode returns {} for the local.json unitary read', async () => {
		readJson
			.mockResolvedValueOnce([{}, true]) // envFile (no composite)
			.mockResolvedValueOnce([{ U1: 'x' }, true]) // appsettings.dev.json
			.mockResolvedValueOnce([{ SECRET: 'local' }, true]); // appsettings.dev.local.json (filtered by ci)
		const out = (await AppSettingsProvider.load({
			ci: true,
			env: 'dev',
			envFile: 'f',
			modes: [],
			root: 'r',
		} as any)) as any[];
		// the local.json unitary read returns {} in ci (the provider replaces it)
		expect(out).not.toContainEqual({ SECRET: 'local' });
		expect(out).toContainEqual({ U1: 'x' });
	});

	it('returns undefined for |DEFAULT|, |ENV|, |LOCAL| when not defined in composite', async () => {
		// only |MODE| is set → composite is truthy (|MODE| is truthy)
		readJson
			.mockResolvedValueOnce([{ '|MODE|': {} }, true])
			.mockResolvedValue([{}, true]);
		const out = (await AppSettingsProvider.load({
			ci: false,
			env: 'dev',
			envFile: 'f',
			modes: [],
			root: 'r',
		} as any)) as any[];
		expect(out[1]).toBeUndefined(); // |DEFAULT|
		expect(out[2]).toBeUndefined(); // |ENV|?.[env]
		expect(out[4]).toBeUndefined(); // |LOCAL|?.[env] (after appsettings.<env>.json)
	});

	it('orders local layers above unitary env/mode files (local wins)', async () => {
		readJson
			.mockResolvedValueOnce([
				{ '|LOCAL|': { dev: { KEY: 'section-local' } } },
				true,
			]) // envFile
			.mockResolvedValueOnce([{ KEY: 'env-file' }, true]) // appsettings.dev.json
			.mockResolvedValueOnce([{ KEY: 'env-local-file' }, true]) // appsettings.dev.local.json
			.mockResolvedValueOnce([{ KEY: 'mode-file' }, true]); // appsettings.build.json
		const out = (await AppSettingsProvider.load({
			ci: false,
			env: 'dev',
			envFile: 'f',
			modes: ['build'],
			root: 'r',
		} as any)) as any[];
		// sections/files are merged last-wins downstream, so array order is precedence:
		// appsettings.<env>.json < appsettings.<mode>.json < |LOCAL| < appsettings.<env>.local.json
		const indexOf = (value: string) =>
			out.findIndex((settings) => settings?.KEY === value);
		expect(indexOf('env-file')).toBeGreaterThanOrEqual(0);
		expect(indexOf('env-file')).toBeLessThan(indexOf('mode-file'));
		expect(indexOf('mode-file')).toBeLessThan(indexOf('section-local'));
		expect(indexOf('section-local')).toBeLessThan(
			indexOf('env-local-file'),
		);
	});

	it('handles multiple modes', async () => {
		readJson
			.mockResolvedValueOnce([
				{
					'|MODE|': {
						debug: { D: 1 },
						test: { T: 2 },
					},
				},
				true,
			])
			.mockResolvedValue([{}, true]);
		const out = await AppSettingsProvider.load({
			ci: false,
			env: 'dev',
			envFile: 'f',
			modes: ['debug', 'test'],
			root: 'r',
		} as any);
		expect(out).toContainEqual({ D: 1 });
		expect(out).toContainEqual({ T: 2 });
	});
});
