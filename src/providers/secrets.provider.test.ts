import { afterEach, describe, expect, it, vi } from 'vitest';

const readJson = vi.fn(() => Promise.resolve([{ S: 'v' }, true]));
vi.mock('../utils/index.js', async () => {
	const actual = await vi.importActual<any>('../utils/index.js');
	return { ...actual, readJson };
});

const { SecretsProvider } = await import('./secrets.provider.js');

afterEach(() => vi.clearAllMocks());

describe('SecretsProvider', () => {
	it('exposes the secrets key', () => {
		expect(SecretsProvider.key).toBe('secrets');
	});

	it('exposes load and builder', () => {
		expect(typeof SecretsProvider.load).toBe('function');
		expect(typeof SecretsProvider.builder).toBe('function');
	});
});

describe('SecretsProvider.builder', () => {
	it('registers the secretsFile option', () => {
		const options = vi.fn();
		SecretsProvider.builder!({ options } as any);
		expect(options).toHaveBeenCalledOnce();
		const arg = options.mock.calls[0][0] as Record<string, unknown>;
		expect(arg).toHaveProperty('secretsFile');
	});
});

describe('SecretsProvider.load', () => {
	it('returns [] with no env', async () => {
		const result = await SecretsProvider.load({} as any);
		expect(result).toEqual([]);
		expect(readJson).not.toHaveBeenCalled();
	});

	it('returns [] with empty string env', async () => {
		const result = await SecretsProvider.load({ env: '' } as any);
		expect(result).toEqual([]);
		expect(readJson).not.toHaveBeenCalled();
	});

	it('reads secrets when env is present', async () => {
		readJson.mockResolvedValue([{ MY_SECRET: 'hello' }, true] as any);
		const result = await SecretsProvider.load({
			env: 'dev',
			secretsFile: 'env/dev.env.json',
		} as any);
		expect(result).toEqual([{ MY_SECRET: 'hello' }]);
		expect(readJson).toHaveBeenCalledWith('env/dev.env.json');
	});
});
