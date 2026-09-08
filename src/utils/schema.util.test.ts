import { describe, expect, it } from 'vitest';
import {
	createValidator,
	createValidators,
	flatSchema,
	isJsonSchemaObject,
	schemaFrom,
	schemaToJson,
} from './schema.util.js';

describe('schemaFrom', () => {
	it('produces an object-typed schema', async () => {
		const s = await schemaFrom({ a: 'x', b: { c: 1 } }, { nullable: true });
		expect(s.type).toBe('object');
	});
	it('marks null values nullable in the resulting schema', async () => {
		const s: any = await schemaFrom({ a: null });
		expect(s.properties.a.nullable).toBe(true);
	});
	it('wraps nested values type in an array and sets nullable from options', async () => {
		const s: any = await schemaFrom({ a: 'x' }, { nullable: true });
		expect(Array.isArray(s.properties.a.type)).toBe(true);
		expect(s.properties.a.nullable).toBe(true);
	});
	it('defaults nullable to false for nested values when not specified', async () => {
		const s: any = await schemaFrom({ a: 'x' });
		expect(s.properties.a.nullable).toBe(false);
	});
	it('generates schema for arrays with length greater than 2', async () => {
		const s: any = await schemaFrom({
			CORS_ORIGINS: [
				'https://transporte.achs.cl',
				'https://fichaclinica-transporte-adm.achs.cl',
				'https://fichaclinica-transporte-liberacion-ot.achs.cl',
				'https://api.achs.cl',
			],
		});
		expect(s.properties.CORS_ORIGINS.type).toEqual(['array']);
		expect(s.properties.CORS_ORIGINS.items.type).toEqual(['string']);
		expect(s.properties.CORS_ORIGINS.nullable).toBe(false);
		expect(s.properties.CORS_ORIGINS.items.nullable).toBe(false);
	});
	it('generates schema for arrays of objects with length greater than 2', async () => {
		const s: any = await schemaFrom({
			ITEMS: [{ id: 1 }, { id: 2 }, { id: 3 }],
		});
		expect(s.properties.ITEMS.type).toEqual(['array']);
		expect(s.properties.ITEMS.items.type).toEqual(['object']);
		expect(s.properties.ITEMS.items.properties.id.type).toEqual([
			'integer',
		]);
	});
	it('handles tuple array items when mode is tuple', async () => {
		const s: any = await schemaFrom(
			{ PAIR: ['hello', 42] },
			{ arrays: { mode: 'tuple' } },
		);
		expect(s.properties.PAIR.type).toEqual(['array']);
		expect(Array.isArray(s.properties.PAIR.items)).toBe(true);
		expect(s.properties.PAIR.items[0].type).toEqual(['string']);
		expect(s.properties.PAIR.items[1].type).toEqual(['integer']);
	});
});

describe('isJsonSchemaObject', () => {
	it('detects type === "object"', () => {
		expect(isJsonSchemaObject({ type: 'object' })).toBe(true);
	});
	it('detects an array of types including "object"', () => {
		expect(isJsonSchemaObject({ type: ['object', 'null'] })).toBe(true);
	});
	it('returns false for non-object types', () => {
		expect(isJsonSchemaObject({ type: 'string' })).toBe(false);
	});
	it('returns false for array type not including object', () => {
		expect(isJsonSchemaObject({ type: ['string', 'null'] })).toBe(false);
	});
});

describe('schemaToJson', () => {
	it('builds a template object from properties', () => {
		expect(
			schemaToJson({
				properties: { a: { default: 'd', type: 'string' } },
				type: 'object',
			}),
		).toEqual({ a: 'd' });
	});
	it('returns null for a nullable leaf without default', () => {
		expect(schemaToJson({ nullable: true, type: 'string' })).toBeNull();
	});
	it('returns undefined for a non-nullable leaf without default', () => {
		expect(schemaToJson({ type: 'string' })).toBeUndefined();
	});
	it('returns the default value for a leaf with default', () => {
		expect(schemaToJson({ default: 'hello', type: 'string' })).toBe(
			'hello',
		);
	});
});

describe('flatSchema', () => {
	it('flattens nested properties', () => {
		expect(
			flatSchema({
				type: 'object',
				properties: {
					g: {
						properties: { v: { type: 'string' } },
						type: 'object',
					},
				},
			}),
		).toEqual({ g__v: { type: 'string' } });
	});
	it('strips the $ global marker so flat keys match the injected env', () => {
		expect(
			flatSchema({
				type: 'object',
				properties: {
					GROUP: {
						properties: { $VAR1: { type: 'string' } },
						type: 'object',
					},
				},
			}),
		).toEqual({ GROUP__VAR1: { type: 'string' } });
	});
	it('skips # prefixed keys', () => {
		const result = flatSchema({
			type: 'object',
			properties: {
				'#x': { type: 'string' },
				a: { type: 'number' },
			},
		});
		expect(result).not.toHaveProperty('#x');
		expect(result).toHaveProperty('a');
	});
	it('returns the leaf schema keyed by parentKey for non-object schema', () => {
		expect(flatSchema({ type: 'string' }, 'k')).toEqual({
			k: { type: 'string' },
		});
	});
	it('uses custom nesting delimiter', () => {
		const result = flatSchema(
			{
				type: 'object',
				properties: {
					a: {
						properties: { b: { type: 'string' } },
						type: 'object',
					},
				},
			},
			'',
			'.',
		);
		expect(result).toHaveProperty('a.b');
	});
});

describe('createValidator', () => {
	it('validates with custom formats (ip-address)', async () => {
		const v = await createValidator({
			properties: { ip: { format: 'ip-address', type: 'string' } },
			type: 'object',
		});
		expect(v({ ip: '1.2.3.4' })).toBe(true);
		expect(v({ ip: 'nope' })).toBe(false);
	});
	it('uses the cached AJV instance on second call with formats', async () => {
		// exercise the cache branch
		const v2 = await createValidator({ type: 'object' });
		expect(v2({})).toBe(true);
	});
	it('creates a validator without formats', async () => {
		const v = await createValidator({ type: 'object' }, false);
		expect(v({})).toBe(true);
	});
	it('uses the cached AJV instance on second call without formats', async () => {
		// exercise the no-formats cache branch
		const v2 = await createValidator({ type: 'object' }, false);
		expect(v2({})).toBe(true);
	});
});

describe('createValidators', () => {
	it('builds a lookup of validator functions', async () => {
		const vs = await createValidators({ p: { type: 'object' } });
		expect(typeof vs.p).toBe('function');
	});
	it('validates correctly from the lookup', async () => {
		const vs = await createValidators({
			nums: { properties: { x: { type: 'number' } }, type: 'object' },
		});
		expect(vs.nums({ x: 1 })).toBe(true);
		expect(vs.nums({ x: 'str' })).toBe(false);
	});
	it('validates utc-millisec format (covers the format function)', async () => {
		const v = await createValidator({
			properties: { ts: { format: 'utc-millisec', type: 'string' } },
			type: 'object',
		});
		expect(v({ ts: '1234567890' })).toBe(true);
		expect(v({ ts: 'not-a-number' })).toBe(false);
	});
});
