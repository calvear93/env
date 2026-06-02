import { describe, expect, it } from 'vitest';
import { flatten, normalize } from './normalize.util.js';

describe('normalize $ strip (regression)', () => {
	it('strips only a leading $', () => {
		expect(normalize({ $S: 'v', A$B: 'x' })).toEqual({ A$B: 'x', S: 'v' });
	});
});

describe('flatten', () => {
	it('nests with the delimiter and skips undefined/functions/# keys', () => {
		expect(
			flatten({
				'#skip': 1,
				a: 1,
				b: { c: 2 },
				d: undefined,
				e: () => 0,
			}),
		).toEqual({ a: 1, b__c: 2 });
	});
	it('keeps arrays as leaf values', () => {
		expect(flatten({ a: [1, 2] })).toEqual({ a: [1, 2] });
	});
	it('keeps null as a leaf value', () => {
		expect(flatten({ n: null })).toEqual({ n: null });
	});
	it('uses a custom nesting delimiter', () => {
		expect(flatten({ a: { b: 1 } }, '.')).toEqual({ 'a.b': 1 });
	});
	it('supports a parent key prefix', () => {
		expect(flatten({ a: 1 }, '__', 'p__')).toEqual({ p__a: 1 });
	});
	it('strips the $ global marker per segment (leading only)', () => {
		expect(flatten({ $TOP: 2, A$B: 3, GROUP: { $VAR1: 1 } })).toEqual({
			A$B: 3,
			GROUP__VAR1: 1,
			TOP: 2,
		});
	});
});

describe('normalize', () => {
	it('strips leading $ and skips null/undefined/functions', () => {
		expect(
			normalize({ $S: 'v', a: null, b: undefined, n: 1, f: () => 0 }),
		).toEqual({ n: 1, S: 'v' });
	});
	it('keeps primitive leaf values', () => {
		expect(normalize({ x: 42, y: 'hello', z: true })).toEqual({
			x: 42,
			y: 'hello',
			z: true,
		});
	});
	it('joins primitive arrays, dropping objects', () => {
		expect(normalize({ a: [1, 'x', { o: 1 }] })).toEqual({ a: '1,x' });
	});
	it('decomposes arrays when arrayDescomposition is enabled', () => {
		expect(normalize({ a: [1, { b: 2 }] }, '__', true)).toEqual({
			a__0: 1,
			a__1__b: 2,
		});
	});
	it('recurses nested objects', () => {
		expect(normalize({ g: { v: 1 } })).toEqual({ g__v: 1 });
	});
});
