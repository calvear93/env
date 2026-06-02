import type { Format, JSONSchemaType, ValidateFunction } from 'ajv';
import type { Options } from 'to-json-schema';

// cached AJV instances (with and without formats)
let _ajv: any;
let _ajvWithFormats: any;

// cached module references
let _AjvClass: any;
let _addFormats: any;
let _toJsonSchema: any;

/* eslint-disable regexp/no-useless-assertions, regexp/no-super-linear-backtracking -- domain validation regexes from JSON Schema spec; modifying these patterns would change format validation behavior */
const FORMAT_REGEXPS: Record<string, Format> = {
	'ip-address':
		/^(?:(?:25[0-5]|2[0-4]\d|[01]?\d{1,2})\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d{1,2})$/,

	color: /^(#?([\dA-Fa-f]{3}){1,2}\b|aqua|black|blue|fuchsia|gray|green|lime|maroon|navy|olive|orange|purple|red|silver|teal|white|yellow|(rgb\(\s*\b(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\b\s*,\s*\b(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\b\s*,\s*\b(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\b\s*\))|(rgb\(\s*(\d?\d%|100%)+\s*,\s*(\d?\d%|100%)+\s*,\s*(\d?\d%|100%)+\s*\)))$/,

	hostname:
		/^(?=.{1,255}$)[\da-z](?:[\da-z-]{0,61}[\da-z])?(?:\.[\da-z](?:[\da-z-]{0,61}[\da-z])?)*\.?$/i,

	alphanumeric: /^[\da-z]+$/i,

	'utc-millisec': (input: string) => !Number.isNaN(+input),

	alpha: /^[a-z]+$/i,

	style: /\s*(.+?):\s*([^;]+);?/g,

	phone: /^\+(?:\d ?){6,14}\d$/,
};
/* eslint-enable regexp/no-useless-assertions, regexp/no-super-linear-backtracking */

/**
 * Generates JSON schema from JSON template/object.
 *
 * @export
 * @param {Record<string, unknown>} json json object
 * @param {Options} [options]
 *
 * @returns {*}  {Promise<Record<string, unknown>>}
 */
export async function schemaFrom(
	json: Record<string, unknown>,
	options?: Options & { nullable?: boolean },
): Promise<Record<string, unknown>> {
	if (!_toJsonSchema) {
		const mod = await import('to-json-schema');
		_toJsonSchema = mod.default;
	}

	return _toJsonSchema(json, {
		required: false,
		...options,
		postProcessFnc: (
			type: string,
			schema: any,
			value: unknown,
			defaultFunc: any,
		) => {
			if (value !== json) {
				schema.type = [type];
				schema.nullable = options?.nullable ?? false;
			}

			if (value === null || value === undefined) schema.nullable = true;

			return defaultFunc(type, schema, value);
		},
	});
}

/**
 * Validates if a object is a JSON schema.
 *
 * @export
 * @param {Record<string, unknown>} schema
 *
 * @returns {boolean} if is a JSON schema
 */
export function isJsonSchemaObject(
	schema: Record<string, unknown>,
): schema is JSONSchemaType<object> {
	if (schema.type === 'object') return true;

	return (
		Array.isArray(schema.type) &&
		(schema.type as string[]).includes('object')
	);
}

/**
 * Converts a JSON schema to JSON template.
 *
 * @export
 * @param {Record<string, unknown>} schema JSON schema
 * @param {Record<string, any>} [container] template container
 *
 * @returns {unknown} object or default value
 */
export function schemaToJson(
	schema: Record<string, unknown>,
	container: Record<string, any> = {},
): unknown {
	if (isJsonSchemaObject(schema)) {
		for (const key in schema.properties)
			container[key] = schemaToJson(schema.properties[key]);

		return container;
	} else {
		return schema.default ?? (schema.nullable ? null : undefined);
	}
}

/**
 * Flatten a JSON schema.
 *
 * @export
 * @param {Record<string, unknown>} schema JSON schema
 * @param {string} [parentKey] previous level key
 * @param {string} [nestingDelimiter] char for delimit nesting levels
 * @param {Record<string, any>} [container] result container
 *
 * @returns {Record<string, unknown>} flattened schema
 */
export function flatSchema(
	schema: Record<string, unknown>,
	parentKey = '',
	nestingDelimiter = '__',
	container: Record<string, any> = {},
): Record<string, unknown> {
	if (isJsonSchemaObject(schema)) {
		for (const key in schema.properties) {
			if (key[0] === '#') continue;

			// global property: strip the `$` marker so the flat schema key
			// matches the injected env key (which flatten/normalize also strip)
			const cleanKey = key[0] === '$' ? key.slice(1) : key;
			const subKey =
				parentKey + (parentKey ? nestingDelimiter : '') + cleanKey;

			container = {
				...container,
				...flatSchema(schema.properties[key], subKey, nestingDelimiter),
			};
		}

		return container;
	} else {
		return { [parentKey]: schema };
	}
}

/**
 * Creates a JSON schema validator using AJV.
 *
 * @see https://ajv.js.org/
 *
 * @export
 * @param {Record<string, object>} schema json schema by provider
 * @param {boolean} enableFormats whether formats are enabled
 *
 * @returns {Promise<ValidateFunction>} validators
 */
export async function createValidator(
	schema: Record<string, unknown>,
	enableFormats = true,
): Promise<ValidateFunction> {
	const ajv = await getAjv(enableFormats);

	return ajv.compile(schema);
}

/**
 * Creates a JSON schema validator lookup using AJV.
 *
 * @see https://ajv.js.org/
 *
 * @export
 * @param {Record<string, object>} schemaLookup json schema by provider
 * @param {boolean} enableFormats whether formats are enabled
 *
 * @returns {Promise<Record<string, ValidateFunction>>} validators lookup
 */
export async function createValidators(
	schemaLookup: Record<string, object>,
	enableFormats = true,
): Promise<Record<string, ValidateFunction>> {
	const ajv = await getAjv(enableFormats);

	const validators: Record<string, ValidateFunction> = {};

	for (const key in schemaLookup)
		validators[key] = ajv.compile(schemaLookup[key]);

	return validators;
}

/**
 * Returns a cached AJV instance (lazy-loads ajv and ajv-formats on first call).
 *
 * @param {boolean} withFormats whether to include format validators
 * @returns {Promise<any>} cached AJV instance
 */
async function getAjv(withFormats: boolean): Promise<any> {
	if (!_AjvClass) {
		const [ajvMod, formatsMod] = await Promise.all([
			import('ajv'),
			import('ajv-formats'),
		]);
		_AjvClass = ajvMod.Ajv;
		_addFormats = formatsMod.default;
	}

	if (withFormats) {
		if (!_ajvWithFormats) {
			_ajvWithFormats = new _AjvClass({
				allErrors: true,
				allowUnionTypes: true,
			});

			(
				_addFormats as unknown as (
					ajv: any,
					options?: { mode?: string },
				) => void
			)(_ajvWithFormats, { mode: 'fast' });

			for (const key in FORMAT_REGEXPS)
				_ajvWithFormats.addFormat(key, FORMAT_REGEXPS[key]);
		}

		return _ajvWithFormats;
	}

	if (!_ajv) {
		_ajv = new _AjvClass({
			allErrors: true,
			allowUnionTypes: true,
		});
	}

	return _ajv;
}
