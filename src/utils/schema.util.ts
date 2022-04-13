import Ajv, { Format, JSONSchemaType, ValidateFunction } from 'ajv';
import addFormats from 'ajv-formats';
import toJsonSchema, { Options } from 'to-json-schema';

const FORMAT_REGEXPS: Record<string, Format> = {
    'ip-address':
        /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d{1,2})\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d{1,2})$/,

    color: /^(#?([\dA-Fa-f]{3}){1,2}\b|aqua|black|blue|fuchsia|gray|green|lime|maroon|navy|olive|orange|purple|red|silver|teal|white|yellow|(rgb\(\s*\b(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\b\s*,\s*\b(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\b\s*,\s*\b(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\b\s*\))|(rgb\(\s*(\d?\d%|100%)+\s*,\s*(\d?\d%|100%)+\s*,\s*(\d?\d%|100%)+\s*\)))$/,

    hostname:
        /^(?=.{1,255}$)[\dA-Za-z](?:(?:[\dA-Za-z]|-){0,61}[\dA-Za-z])?(?:\.[\dA-Za-z](?:(?:[\dA-Za-z]|-){0,61}[\dA-Za-z])?)*\.?$/,

    alphanumeric: /^[\dA-Za-z]+$/,

    'utc-millisec': (input: string) => !Number.isNaN(+input),

    alpha: /^[A-Za-z]+$/,

    style: /\s*(.+?):\s*([^;]+);?/g,

    phone: /^\+(?:\d ?){6,14}\d$/
};

/**
 * Generates JSON schema from JSON template/object.
 *
 * @export
 * @param {Record<string, unknown>} json json object
 * @param {Options} [options]
 *
 * @returns {*}  {Record<string, unknown>}
 */
export function schemaFrom(
    json: Record<string, unknown>,
    options?: Options & { nullable?: boolean }
): Record<string, unknown> {
    return toJsonSchema(json, {
        required: false,
        ...options,
        postProcessFnc: (type, schema, value, defaultFunc) => {
            if (value !== json) {
                schema.type = [type];
                schema.nullable = options?.nullable ?? false;
            }

            return defaultFunc(type, schema, value);
        }
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
    schema: Record<string, unknown>
): schema is JSONSchemaType<object> {
    if (schema.type === 'object') return true;

    return Array.isArray(schema.type) && schema.type.includes('object');
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
    container: Record<string, any> = {}
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
    container: Record<string, any> = {}
): Record<string, unknown> {
    if (isJsonSchemaObject(schema)) {
        for (const key in schema.properties) {
            if (key[0] === '#') continue;

            // global property, but prefix removed for injection
            const subKey =
                parentKey + (parentKey ? nestingDelimiter : '') + key;

            container = {
                ...container,
                ...flatSchema(schema.properties[key], subKey)
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
 * @returns {ValidateFunction} validator
 */
export function createValidator(
    schema: Record<string, unknown>,
    enableFormats = true
): ValidateFunction {
    const ajv = new Ajv({
        allErrors: true,
        allowUnionTypes: true
    });

    if (enableFormats) {
        addFormats(ajv, { mode: 'fast' });

        for (const key in FORMAT_REGEXPS)
            ajv.addFormat(key, FORMAT_REGEXPS[key]);
    }

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
 * @returns {Record<string, ValidateFunction>} validators lookup
 */
export function createValidators(
    schemaLookup: Record<string, object>,
    enableFormats = true
): Record<string, ValidateFunction> {
    const ajv = new Ajv({
        allErrors: true,
        allowUnionTypes: true
    });

    if (enableFormats) {
        addFormats(ajv, { mode: 'fast' });

        for (const key in FORMAT_REGEXPS)
            ajv.addFormat(key, FORMAT_REGEXPS[key]);
    }

    const validators: Record<string, ValidateFunction> = {};

    for (const key in schemaLookup)
        validators[key] = ajv.compile(schemaLookup[key]);

    return validators;
}
