import { afterEach, describe, expect, it, vi } from 'vitest';

const existsSync = vi.fn();
vi.mock('node:fs', () => ({ existsSync }));

const writeJson = vi.fn(() => Promise.resolve(true));
const readJson = vi.fn(() => Promise.resolve([{ A: 1 }, true]));
vi.mock('../utils/index.js', async () => {
	const actual = await vi.importActual<any>('../utils/index.js');
	return { ...actual, readJson, writeJson };
});

const { LocalProvider } = await import('./local.provider.js');

afterEach(() => vi.clearAllMocks());

describe('LocalProvider', () => {
	it('exposes the local key', () => {
		expect(LocalProvider.key).toBe('local');
	});

	it('exposes load and builder', () => {
		expect(typeof LocalProvider.load).toBe('function');
		expect(typeof LocalProvider.builder).toBe('function');
	});
});

describe('LocalProvider.builder', () => {
	it('registers the localFile option', () => {
		const options = vi.fn();
		LocalProvider.builder!({ options } as any);
		expect(options).toHaveBeenCalledOnce();
		const arg = options.mock.calls[0][0] as Record<string, unknown>;
		expect(arg).toHaveProperty('localFile');
	});
});

describe('LocalProvider.load', () => {
	it('returns [] in ci mode', async () => {
		const result = await LocalProvider.load({
			ci: true,
			env: 'dev',
		} as any);
		expect(result).toEqual([]);
		expect(readJson).not.toHaveBeenCalled();
	});

	it('returns [] with no env', async () => {
		const result = await LocalProvider.load({ ci: false } as any);
		expect(result).toEqual([]);
		expect(readJson).not.toHaveBeenCalled();
	});

	it('returns [] with empty string env', async () => {
		const result = await LocalProvider.load({ ci: false, env: '' } as any);
		expect(result).toEqual([]);
		expect(readJson).not.toHaveBeenCalled();
	});

	it('creates an empty file and returns [] when local file is missing', async () => {
		existsSync.mockReturnValue(false);
		const result = await LocalProvider.load({
			ci: false,
			env: 'dev',
			localFile: 'env/dev.local.env.json',
		} as any);
		expect(result).toEqual([]);
		expect(writeJson).toHaveBeenCalledWith('env/dev.local.env.json', {});
	});

	it('reads vars when local file is present', async () => {
		existsSync.mockReturnValue(true);
		readJson.mockResolvedValue([{ MY_VAR: 'hello' }, true] as any);
		const result = await LocalProvider.load({
			ci: false,
			env: 'dev',
			localFile: 'env/dev.local.env.json',
		} as any);
		expect(result).toEqual([{ MY_VAR: 'hello' }]);
		expect(readJson).toHaveBeenCalledWith('env/dev.local.env.json');
	});

	it('does not call writeJson when file exists', async () => {
		existsSync.mockReturnValue(true);
		await LocalProvider.load({
			ci: false,
			env: 'dev',
			localFile: 'f',
		} as any);
		expect(writeJson).not.toHaveBeenCalled();
	});
});
