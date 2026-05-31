import { describe, expect, it } from 'vitest';
import { interpolate, interpolateJson, isRecord } from './interpolate.util.js';

describe('isRecord', () => {
	it('rejects null', () => {
		expect(isRecord(null)).toBe(false);
	});
	it('rejects a string primitive', () => {
		expect(isRecord('x')).toBe(false);
	});
	it('rejects an empty object', () => {
		expect(isRecord({})).toBe(false);
	});
	it('accepts a non-empty object', () => {
		expect(isRecord({ a: 1 })).toBe(true);
	});
});

describe('interpolate', () => {
	it('returns a string without the delimiter unchanged', () => {
		expect(interpolate('plain', {})).toBe('plain');
	});
	it('replaces a templated string', () => {
		expect(interpolate('[[root]]/x', { root: 'env' })).toBe('env/x');
	});
	it('maps arrays recursively', () => {
		expect(interpolate(['[[a]]', 'b'], { a: '1' })).toEqual(['1', 'b']);
	});
	it('recurses into records', () => {
		expect(interpolate({ k: '[[a]]' }, { a: '1' })).toEqual({ k: '1' });
	});
	it('passes through non-string/array/record values (primitive fallback)', () => {
		expect(interpolate(5 as unknown, {})).toBe(5);
	});
	it('honors custom delimiters', () => {
		expect(interpolate('<a>', { a: '1' }, ['<', '>'])).toBe('1');
	});
});

describe('interpolateJson', () => {
	it('mutates and returns the same values object', () => {
		const values = { k: '[[a]]' };
		const out = interpolateJson(values, { a: '1' });
		expect(out).toBe(values);
		expect(out.k).toBe('1');
	});
	it('leaves non-templated values unchanged', () => {
		const values = { n: 42 as unknown, x: 'hello' };
		interpolateJson(values as Record<string, unknown>, {});
		expect(values.x).toBe('hello');
		expect(values.n).toBe(42);
	});
});
