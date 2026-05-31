import { describe, expect, it } from 'vitest';
import { IntegratedProviderConfig, IntegratedProviders } from './index.js';

describe('integrated providers registry', () => {
	it('registers all four providers in order', () => {
		expect(Object.keys(IntegratedProviders)).toEqual([
			'app-settings',
			'local',
			'package-json',
			'secrets',
		]);
	});

	it('has four provider config entries', () => {
		expect(IntegratedProviderConfig).toHaveLength(4);
	});

	it('each config entry has a path', () => {
		for (const cfg of IntegratedProviderConfig) {
			expect(typeof cfg.path).toBe('string');
			expect(cfg.path.length).toBeGreaterThan(0);
		}
	});

	it('orders provider config by load/merge precedence (base → highest)', () => {
		// the array sequence is semantic: later providers override earlier ones
		expect(IntegratedProviderConfig.map((c) => c.path)).toEqual([
			'package-json',
			'app-settings',
			'secrets',
			'local',
		]);
	});

	it('every config path resolves to a registered provider', () => {
		const keys = new Set(Object.keys(IntegratedProviders));
		for (const { path } of IntegratedProviderConfig)
			expect(keys.has(path)).toBe(true);
	});

	it('each provider in the registry has load/key fields', () => {
		for (const [key, provider] of Object.entries(IntegratedProviders)) {
			expect(provider.key).toBe(key);
			expect(typeof provider.load).toBe('function');
		}
	});
});
