import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import toJsonSchema, { Options } from 'to-json-schema';

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

export function createValidator(schema: Record<string, unknown>) {
    const ajv = new Ajv();
    addFormats(ajv);

    return ajv.compile(schema);
}
