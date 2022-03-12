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
 * @param {boolean} arrayDescomposition serialize or break down arrays
 *
 * @returns {Record<string, string>} normalized object
 */
export function normalize(
    obj: Record<string, any>,
    nestingDelimiter = '__',
    arrayDescomposition = false,
    pkey = ''
): Record<string, string> {
    const flattened: Record<string, string> = {};

    for (let key in obj) {
        const value = obj[key];
        const type = typeof value;

        // skipped property
        if (key[0] === '#') continue;
        // global property, but prefix removed for injection
        key = pkey + key.replace('$', '');

        if (type !== 'object' || value === null) {
            if (value !== undefined && type !== 'function')
                flattened[key] = value;

            continue;
        }

        if (Array.isArray(value)) {
            normalizeArray(
                flattened,
                key,
                value,
                nestingDelimiter,
                arrayDescomposition
            );
        } else {
            Object.assign(
                flattened,
                normalize(
                    value,
                    nestingDelimiter,
                    arrayDescomposition,
                    `${key}${nestingDelimiter}`
                )
            );
        }
    }

    return flattened;
}

/**
 * Flatten and normalizes an array.
 *
 * @param {Record<string, string>} flattened
 * @param {string} key
 * @param {any[]} value
 * @param {string} [nestingDelimiter='__']
 * @param {boolean} [arrayDescomposition=false]
 */
function normalizeArray(
    flattened: Record<string, string>,
    key: string,
    value: any[],
    nestingDelimiter = '__',
    arrayDescomposition = false
): void {
    if (arrayDescomposition) {
        key = `${key}${nestingDelimiter}`;

        for (let i = 0; i < value.length; i++) {
            if (typeof value[i] === 'object') {
                Object.assign(
                    flattened,
                    normalize(
                        value[i],
                        nestingDelimiter,
                        arrayDescomposition,
                        `${key}${i}${nestingDelimiter}`
                    )
                );
            } else {
                flattened[`${key}${i}`] = value[i];
            }
        }
    } else {
        flattened[key] = value.filter((v) => typeof v !== 'object').join(',');
    }
}
