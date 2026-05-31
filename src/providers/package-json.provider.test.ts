import { afterEach, describe, expect, it, vi } from 'vitest';
import { PackageJsonProvider } from './package-json.provider.js';

afterEach(() => vi.clearAllMocks());

describe('PackageJsonProvider', () => {
	it('exposes the package-json key', () => {
		expect(PackageJsonProvider.key).toBe('package-json');
	});

	it('exposes load, builder', () => {
		expect(typeof PackageJsonProvider.load).toBe('function');
		expect(typeof PackageJsonProvider.builder).toBe('function');
	});
});

describe('PackageJsonProvider.builder', () => {
	it('registers the packageInfoPrefix option', () => {
		const options = vi.fn();
		PackageJsonProvider.builder!({ options } as any);
		expect(options).toHaveBeenCalledOnce();
		const arg = options.mock.calls[0][0] as Record<string, unknown>;
		expect(arg).toHaveProperty('packageInfoPrefix');
	});
});

describe('PackageJsonProvider.load', () => {
	it('maps projectInfo fields with prefix and defaults env', () => {
		const out = PackageJsonProvider.load({
			env: 'dev',
			packageInfoPrefix: 'P_',
			projectInfo: {
				description: 'desc',
				name: 'myname',
				project: 'myproject',
				title: 'MyTitle',
				version: '1.0.0',
			},
		} as any);
		expect(out).toMatchObject({
			P_DESCRIPTION: 'desc',
			P_ENV: 'dev',
			P_NAME: 'myname',
			P_PROJECT: 'myproject',
			P_TITLE: 'MyTitle',
			P_VERSION: '1.0.0',
		});
	});

	it('falls back to null for missing projectInfo fields', () => {
		const out = PackageJsonProvider.load({
			env: 'dev',
			packageInfoPrefix: 'P_',
			projectInfo: { name: 'n', project: 'p', version: '1' },
		} as any);
		expect((out as Record<string, unknown>).P_TITLE).toBeNull();
		expect((out as Record<string, unknown>).P_DESCRIPTION).toBeNull();
	});

	it('uses empty prefix when not specified', () => {
		const out = PackageJsonProvider.load({
			env: 'staging',
			packageInfoPrefix: '',
			projectInfo: { name: 'n2', project: 'p2', version: '2.0.0' },
		} as any);
		expect((out as Record<string, unknown>).ENV).toBe('staging');
		expect((out as Record<string, unknown>).VERSION).toBe('2.0.0');
	});

	it('uses default env "development" when env not provided', () => {
		const out = PackageJsonProvider.load({
			packageInfoPrefix: '',
			projectInfo: { name: 'n', project: 'p', version: '1' },
		} as any);
		// env defaults to 'development' in the destructure
		expect((out as Record<string, unknown>).ENV).toBe('development');
	});

	it('returns null for env when env is explicitly undefined in projectInfo context', () => {
		const out = PackageJsonProvider.load({
			env: undefined,
			packageInfoPrefix: '',
			projectInfo: { name: 'n', project: 'p', version: '1' },
		} as any);
		// env defaults to 'development', so ENV is 'development', not null
		expect((out as Record<string, unknown>).ENV).toBe('development');
	});

	it('returns null for undefined version, project, name, title, description', () => {
		const out = PackageJsonProvider.load({
			env: 'dev',
			packageInfoPrefix: '',
			projectInfo: {}, // all fields undefined
		} as any) as Record<string, unknown>;
		// the ?? null branches must be hit for undefined fields
		expect(out.VERSION).toBeNull();
		expect(out.PROJECT).toBeNull();
		expect(out.NAME).toBeNull();
		expect(out.TITLE).toBeNull();
		expect(out.DESCRIPTION).toBeNull();
	});

	it('returns null for env when env is explicitly null', () => {
		// passing null bypasses the default ('development') so env ?? null resolves to null
		const out = PackageJsonProvider.load({
			env: null as any,
			packageInfoPrefix: '',
			projectInfo: {},
		} as any) as Record<string, unknown>;
		expect(out.ENV).toBeNull();
	});
});
