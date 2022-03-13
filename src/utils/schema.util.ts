import Ajv, { ValidateFunction } from 'ajv';
import addFormats from 'ajv-formats';
import toJsonSchema, { Options } from 'to-json-schema';

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
 * Creates a JSON schema validator lookup using AJV.
 *
 * @see https://ajv.js.org/
 *
 * @export
 * @param {Record<string, object>} createValidators json schema by provider
 * @param {boolean} enableFormats whether formats are enabled
 *
 * @returns {Record<string, ValidateFunction>} validators lookup
 */
export function createValidators(
    schemaLookup: Record<string, object>,
    enableFormats = true
): Record<string, ValidateFunction> {
    const ajv = new Ajv();
    enableFormats && addFormats(ajv);

    const validators: Record<string, ValidateFunction> = {};

    for (const key in schemaLookup)
        validators[key] = ajv.compile(schemaLookup[key]);

    return validators;
}
