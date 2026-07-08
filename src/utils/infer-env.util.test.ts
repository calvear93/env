import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { logger } from './logger.js';

const readJson = vi.fn();
vi.mock('./json.util.js', async () => {
	const actual = await vi.importActual<any>('./json.util.js');
	return { ...actual, readJson };
});

const readdir = vi.fn();
vi.mock('node:fs/promises', async () => {
	const actual = await vi.importActual<any>('node:fs/promises');
	return { ...actual, readdir };
});

const util = await import('./infer-env.util.js');

const DELIMITERS: [string, string] = ['[[', ']]'];

let debug: ReturnType<typeof vi.spyOn>;
let error: ReturnType<typeof vi.spyOn>;
let info: ReturnType<typeof vi.spyOn>;
let warn: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
	delete process.env.npm_lifecycle_event;

	readJson.mockResolvedValue([{}, false]);
	readdir.mockResolvedValue([]);

	debug = vi.spyOn(logger, 'debug').mockImplementation((() => {}) as any);
	error = vi.spyOn(logger, 'error').mockImplementation((() => {}) as any);
	info = vi.spyOn(logger, 'info').mockImplementation((() => {}) as any);
	warn = vi.spyOn(logger, 'warn').mockImplementation((() => {}) as any);
});

afterEach(() => {
	delete process.env.npm_lifecycle_event;

	vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// inferEnvFromScript
// ---------------------------------------------------------------------------
describe('inferEnvFromScript', () => {
	it('returns undefined when lifecycle event is undefined', () => {
		expect(util.inferEnvFromScript(undefined)).toBeUndefined();
	});

	it('returns undefined when script name has no ":" suffix', () => {
		expect(util.inferEnvFromScript('preview')).toBeUndefined();
	});

	it('extracts the suffix after ":"', () => {
		expect(util.inferEnvFromScript('start:dev')).toBe('dev');
		expect(util.inferEnvFromScript('test:qa')).toBe('qa');
	});

	it('extracts the last segment on multiple ":"', () => {
		expect(util.inferEnvFromScript('a:b:c')).toBe('c');
	});

	it('returns undefined on empty suffix', () => {
		expect(util.inferEnvFromScript('start:')).toBeUndefined();
	});
});

// ---------------------------------------------------------------------------
// discoverEnvironments
// ---------------------------------------------------------------------------
describe('discoverEnvironments', () => {
	it('includes |ENV| and |LOCAL| section keys from appsettings', async () => {
		readJson.mockResolvedValue([
			{ '|ENV|': { dev: {}, qa: {} }, '|LOCAL|': { stage: {} } },
			true,
		]);

		const known = await util.discoverEnvironments({}, DELIMITERS);

		expect(known).toEqual(new Set(['dev', 'qa', 'stage']));
		expect(readJson).toHaveBeenCalledWith('env/appsettings.json');
	});

	it('discovers environments from per-env files', async () => {
		readdir.mockResolvedValue([
			'appsettings.dev.json',
			'appsettings.qa.local.json',
			'prod.env.json',
			'stage.local.env.json',
			'appsettings.json',
			'env.schema.json',
			'keys.json',
			'settings',
		]);

		const known = await util.discoverEnvironments({}, DELIMITERS);

		expect(known).toEqual(new Set(['dev', 'prod', 'qa', 'stage']));
	});

	it('excludes appsettings.<mode>.json for |MODE| section keys', async () => {
		readJson.mockResolvedValue([{ '|MODE|': { debug: {} } }, true]);
		readdir.mockResolvedValue([
			'appsettings.debug.json',
			'appsettings.dev.json',
		]);

		const known = await util.discoverEnvironments({}, DELIMITERS);

		expect(known).toEqual(new Set(['dev']));
	});

	it('excludes appsettings.<mode>.json for runtime modes', async () => {
		readdir.mockResolvedValue(['appsettings.build.json', 'build.env.json']);

		const known = await util.discoverEnvironments(
			{ modes: ['build'] },
			DELIMITERS,
		);

		// <env>.env.json is never ambiguous with mode files
		expect(known).toEqual(new Set(['build']));
	});

	it('returns section environments when root folder does not exist', async () => {
		readJson.mockResolvedValue([{ '|ENV|': { dev: {} } }, true]);
		readdir.mockRejectedValue(new Error('ENOENT'));

		const known = await util.discoverEnvironments({}, DELIMITERS);

		expect(known).toEqual(new Set(['dev']));
	});

	it('interpolates a custom envFile path', async () => {
		await util.discoverEnvironments(
			{ envFile: '[[root]]/custom.json', root: 'myenv' },
			DELIMITERS,
		);

		expect(readJson).toHaveBeenCalledWith('myenv/custom.json');
		expect(readdir).toHaveBeenCalledWith('myenv');
	});
});

// ---------------------------------------------------------------------------
// resolveEnv
// ---------------------------------------------------------------------------
describe('resolveEnv', () => {
	it('keeps a known explicit env without warning', async () => {
		readJson.mockResolvedValue([{ '|ENV|': { dev: {} } }, true]);
		const argv: any = { env: 'dev' };

		await util.resolveEnv(argv, DELIMITERS);

		expect(argv.env).toBe('dev');
		expect(warn).not.toHaveBeenCalled();
	});

	it('warns on unknown explicit env and continues', async () => {
		readJson.mockResolvedValue([{ '|ENV|': { dev: {} } }, true]);
		const argv: any = { env: 'unknown' };

		await util.resolveEnv(argv, DELIMITERS);

		expect(argv.env).toBe('unknown');
		expect(warn).toHaveBeenCalledOnce();
	});

	it('does not warn on explicit env when no environments are known', async () => {
		const argv: any = { env: 'unknown' };

		await util.resolveEnv(argv, DELIMITERS);

		expect(argv.env).toBe('unknown');
		expect(warn).not.toHaveBeenCalled();
	});

	it('skips discovery when there is no env nor npm script', async () => {
		const argv: any = {};

		await util.resolveEnv(argv, DELIMITERS);

		expect(argv.env).toBeUndefined();
		expect(readJson).not.toHaveBeenCalled();
		expect(readdir).not.toHaveBeenCalled();
	});

	it('skips discovery when the npm script has no ":" suffix', async () => {
		process.env.npm_lifecycle_event = 'preview';
		const argv: any = {};

		await util.resolveEnv(argv, DELIMITERS);

		expect(argv.env).toBeUndefined();
		expect(readJson).not.toHaveBeenCalled();
	});

	it('infers a known env from the npm script name', async () => {
		process.env.npm_lifecycle_event = 'start:dev';
		readJson.mockResolvedValue([{ '|ENV|': { dev: {} } }, true]);
		const argv: any = {};

		await util.resolveEnv(argv, DELIMITERS);

		expect(argv.env).toBe('dev');
		expect(info).toHaveBeenCalledOnce();
	});

	it('exits with error on unknown inferred env', async () => {
		process.env.npm_lifecycle_event = 'start:unknown';
		readJson.mockResolvedValue([{ '|ENV|': { dev: {} } }, true]);
		const exit = vi.spyOn(process, 'exit').mockImplementation(() => {
			throw new Error('process.exit');
		});
		const argv: any = {};

		await expect(util.resolveEnv(argv, DELIMITERS)).rejects.toThrow(
			'process.exit',
		);

		expect(exit).toHaveBeenCalledWith(1);
		expect(error).toHaveBeenCalledOnce();
		expect(argv.env).toBeUndefined();
	});

	it('discards the inference when no environments are known', async () => {
		process.env.npm_lifecycle_event = 'start:dev';
		const argv: any = {};

		await util.resolveEnv(argv, DELIMITERS);

		expect(argv.env).toBeUndefined();
		expect(debug).toHaveBeenCalledOnce();
	});

	it('config file env wins over inference', async () => {
		process.env.npm_lifecycle_event = 'start:dev';
		readJson.mockResolvedValue([{ '|ENV|': { dev: {}, qa: {} } }, true]);
		// env preloaded by loadConfigFile from settings.json
		const argv: any = { env: 'qa' };

		await util.resolveEnv(argv, DELIMITERS);

		expect(argv.env).toBe('qa');
		expect(info).not.toHaveBeenCalled();
	});
});
