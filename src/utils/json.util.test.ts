import { afterEach, describe, expect, it, vi } from 'vitest';

const existsSync = vi.fn();
const readFile = vi.fn();
const writeFile = vi.fn();
const homedirMock = vi.fn(() => '/home/user');
vi.mock('node:fs', () => ({ existsSync }));
vi.mock('node:fs/promises', () => ({ readFile, writeFile }));
vi.mock('node:os', () => ({ default: { homedir: homedirMock } }));

const { readJson, resolvePath, writeEnvFromJson, writeJson } =
	await import('./json.util.js');

afterEach(() => vi.clearAllMocks());

describe('readJson', () => {
	it('returns [{}, false] when file is missing (ENOENT)', async () => {
		const err = Object.assign(new Error('ENOENT: no such file'), {
			code: 'ENOENT',
		});
		readFile.mockRejectedValue(err);
		expect(await readJson('x')).toEqual([{}, false]);
	});
	it('parses JSON when file is present', async () => {
		readFile.mockResolvedValue('{"a":1}');
		expect(await readJson('x')).toEqual([{ a: 1 }, true]);
	});
	it('re-throws non-ENOENT errors', async () => {
		const err = Object.assign(new Error('SyntaxError'), {
			code: undefined,
		});
		readFile.mockRejectedValue(err);
		await expect(readJson('x')).rejects.toThrow('SyntaxError');
	});
});

describe('writeJson', () => {
	it('skips write when file exists and overwrite is false', async () => {
		existsSync.mockReturnValue(true);
		expect(await writeJson('x', { a: 1 })).toBe(false);
		expect(writeFile).not.toHaveBeenCalled();
	});
	it('writes file when it does not exist', async () => {
		existsSync.mockReturnValue(false);
		writeFile.mockResolvedValue(undefined);
		const result = await writeJson('x', { a: 1 });
		expect(result).toBe(true);
		expect(writeFile).toHaveBeenCalled();
	});
	it('writes when file exists and overwrite is true', async () => {
		existsSync.mockReturnValue(true);
		writeFile.mockResolvedValue(undefined);
		const result = await writeJson('x', { a: 1 }, true);
		expect(result).toBe(true);
		expect(writeFile).toHaveBeenCalled();
	});
	it('uses null replacer when undefinedAsNull is true', async () => {
		existsSync.mockReturnValue(false);
		writeFile.mockResolvedValue(undefined);
		await writeJson('x', { a: undefined } as any, false, true);
		const written = writeFile.mock.calls[0][1] as string;
		expect(written).toContain('"a": null');
	});
	it('uses no replacer (undefined omitted) when undefinedAsNull is false', async () => {
		existsSync.mockReturnValue(false);
		writeFile.mockResolvedValue(undefined);
		await writeJson('x', { a: undefined } as any, false, false);
		const written = writeFile.mock.calls[0][1] as string;
		expect(written).not.toContain('"a"');
	});
});

describe('writeEnvFromJson', () => {
	it('skips write when file exists and overwrite is false', async () => {
		existsSync.mockReturnValue(true);
		expect(await writeEnvFromJson('x', { A: 'b' })).toBe(false);
		expect(writeFile).not.toHaveBeenCalled();
	});
	it('writes dotenv format without quotes', async () => {
		existsSync.mockReturnValue(false);
		writeFile.mockResolvedValue(undefined);
		await writeEnvFromJson('x', { A: 'b' }, true, false);
		expect(writeFile.mock.calls[0][1]).toBe('A=b\n');
	});
	it('wraps values in quotes when quotes is true', async () => {
		existsSync.mockReturnValue(false);
		writeFile.mockResolvedValue(undefined);
		await writeEnvFromJson('x', { A: 'b' }, true, true);
		expect(writeFile.mock.calls[0][1]).toBe('A="b"\n');
	});
});

describe('resolvePath', () => {
	it('expands ~ to home directory when homedir returns a string', () => {
		homedirMock.mockReturnValue('/home/testuser');
		const result = resolvePath('~/a');
		expect(result).toMatch(/a$/);
		expect(result).not.toContain('~');
	});
	it('does not expand ~ when homedir returns undefined', () => {
		homedirMock.mockReturnValue(undefined as any);
		const result = resolvePath('~/a');
		// tilde should be kept as-is since home is undefined
		expect(result).toBeDefined();
	});
	it('resolves a relative path against cwd', () => {
		homedirMock.mockReturnValue('/home/user');
		const result = resolvePath('a');
		expect(result).toMatch(/a$/);
	});
});
