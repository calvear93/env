/**
 * Flatten a object keeping depth path
 * in key using __ as level separator.
 * Also, converts arrays in list strings,
 * only primitives types array,
 * and removes $ global character from keys.
 *
 * @param {Record<string, any>} obj
 * @param {string} nestingDelimiter char for delimit nesting levels
 * @param {string} pkey first level key
 *
 * @returns {Record<string, string>} normalized object
 */
export function normalize(
    obj: Record<string, any>,
    nestingDelimiter = '__',
    pkey = ''
): Record<string, string> {
    let flattened: Record<string, string> = {};

    for (let key in obj) {
        const value = obj[key];
        const type = typeof value;
        key = pkey + key.replace('$', '');

        if (type !== 'object' || value === null) {
            if (value && type !== 'function') flattened[key] = value;

            continue;
        }

        if (Array.isArray(value)) {
            flattened[key] = value
                .filter((v) => typeof v !== 'object')
                .join(',');
        } else {
            flattened = {
                ...flattened,
                ...normalize(
                    value,
                    nestingDelimiter,
                    `${key}${nestingDelimiter}`
                )
            };
        }
    }

    return flattened;
}
