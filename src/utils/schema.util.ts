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
            if (
                value !== json &&
                options?.nullable &&
                !schema.type?.includes('null')
            )
                schema.type = [type, 'null'];

            return defaultFunc(type, schema, value);
        }
    });
}

/**
 * Creates a JSON schema validator using AJV.
 *
 * @see https://ajv.js.org/
 *
 * @export
 * @param {Record<string, unknown>} schema json schema
 *
 * @returns {ValidateFunction} validator
 */
export function createValidator<T>(schema: T): ValidateFunction<T> {
    const ajv = new Ajv();
    addFormats(ajv);

    return ajv.compile<T>(schema);
}
