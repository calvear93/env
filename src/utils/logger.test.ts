import { describe, expect, it } from 'vitest';
import { configureLogger, createLogger, LOG_LEVELS } from './logger.js';

describe('createLogger', () => {
	it('defaults minLevel to info when called with no args', () => {
		const log = createLogger();
		expect(log.settings.minLevel).toBe(LOG_LEVELS.info);
	});

	it('defaults empty maskValuesOfKeys and maskValuesRegEx when no masks given', () => {
		const log = createLogger();
		expect(log.settings.maskValuesOfKeys).toEqual([]);
		expect(log.settings.maskValuesRegEx).toEqual([]);
	});

	it('maps a named level and masks', () => {
		const log = createLogger({
			maskAnyRegEx: [String.raw`\d+`],
			maskValuesOfKeys: ['SECRET'],
			minLevel: 'debug',
		});
		expect(log.settings.minLevel).toBe(LOG_LEVELS.debug);
		expect(log.settings.maskValuesOfKeys).toEqual(['SECRET']);
		expect(log.settings.maskValuesRegEx?.[0]).toBeInstanceOf(RegExp);
	});

	it('accepts only minLevel without masks', () => {
		const log = createLogger({ minLevel: 'warn' });
		expect(log.settings.minLevel).toBe(LOG_LEVELS.warn);
		expect(log.settings.maskValuesOfKeys).toEqual([]);
	});

	it('accepts only maskValuesOfKeys without minLevel', () => {
		const log = createLogger({ maskValuesOfKeys: ['TOKEN'] });
		expect(log.settings.minLevel).toBe(LOG_LEVELS.info);
		expect(log.settings.maskValuesOfKeys).toEqual(['TOKEN']);
	});

	it('accepts only maskAnyRegEx without minLevel', () => {
		const log = createLogger({ maskAnyRegEx: ['secret.*'] });
		expect(log.settings.maskValuesRegEx).toHaveLength(1);
		expect(log.settings.maskValuesRegEx?.[0]).toBeInstanceOf(RegExp);
	});

	it('forces the global flag so every occurrence is masked', () => {
		const log = createLogger({ maskAnyRegEx: ['secret'] });
		const regex = log.settings.maskValuesRegEx![0]!;
		expect(regex.source).toBe('secret');
		expect(regex.global).toBe(true);
	});

	it('keeps an explicitly supplied global flag without duplicating it', () => {
		const log = createLogger({ maskAnyRegEx: ['/secret/g'] });
		const regex = log.settings.maskValuesRegEx![0]!;
		expect(regex.source).toBe('secret');
		expect(regex.flags).toBe('g');
	});

	it('parses the /source/flags form and keeps extra flags', () => {
		const log = createLogger({ maskAnyRegEx: ['/secret/i'] });
		const regex = log.settings.maskValuesRegEx![0]!;
		expect(regex.source).toBe('secret');
		expect(regex.global).toBe(true);
		expect(regex.ignoreCase).toBe(true);
	});

	it('enables case-insensitive key masking', () => {
		const log = createLogger();
		expect(log.settings.maskValuesOfKeysCaseInsensitive).toBe(true);
	});
});

describe('configureLogger', () => {
	it('mutates minLevel only when provided', () => {
		const log = createLogger({ minLevel: 'info' });
		configureLogger(log, { minLevel: 'error' });
		expect(log.settings.minLevel).toBe(LOG_LEVELS.error);
	});

	it('mutates maskValuesOfKeys when provided', () => {
		const log = createLogger({ maskValuesOfKeys: [] });
		configureLogger(log, { maskValuesOfKeys: ['API_KEY', 'TOKEN'] });
		expect(log.settings.maskValuesOfKeys).toEqual(['API_KEY', 'TOKEN']);
	});

	it('mutates maskAnyRegEx (maskValuesRegEx) when provided', () => {
		const log = createLogger({ maskAnyRegEx: [] });
		configureLogger(log, {
			maskAnyRegEx: [String.raw`\bpassword\b`, String.raw`\d{4}`],
		});
		expect(log.settings.maskValuesRegEx).toHaveLength(2);
		expect(log.settings.maskValuesRegEx?.[0]).toBeInstanceOf(RegExp);
		expect(log.settings.maskValuesRegEx?.[1]).toBeInstanceOf(RegExp);
		expect(log.settings.maskValuesRegEx?.[0]?.global).toBe(true);
	});

	it('is a no-op when empty object provided', () => {
		const log = createLogger({ minLevel: 'warn' });
		const before = log.settings.minLevel;
		configureLogger(log, {});
		expect(log.settings.minLevel).toBe(before);
	});

	it('mutates all three fields when all are provided', () => {
		const log = createLogger({ minLevel: 'info' });
		configureLogger(log, {
			maskAnyRegEx: ['tok.*'],
			maskValuesOfKeys: ['PASS'],
			minLevel: 'debug',
		});
		expect(log.settings.minLevel).toBe(LOG_LEVELS.debug);
		expect(log.settings.maskValuesOfKeys).toEqual(['PASS']);
		expect(log.settings.maskValuesRegEx).toHaveLength(1);
	});
});
