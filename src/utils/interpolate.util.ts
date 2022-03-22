import subslate from 'subslate';

/**
 * Validates value must be a record.
 *
 * @export
 * @param {unknown} obj
 * @returns {*}  {obj is Record<string, unknown>}
 */
export function isRecord(obj: unknown): obj is Record<string, unknown> {
    if (!obj || typeof obj !== 'object') return false;

    return Object.keys(obj).length > 0;
}

/**
 * Replaces string arguments with regex interpolation.
 *
 * @export
 * @template T
 * @param {T} value
 * @param {Record<string, unknown>} args
 * @param {[string, string]} [delimiters=['[[', ']]']]
 *
 * @returns {T} mutated value
 */
export function interpolate<T extends string | unknown>(
    value: T,
    args: Record<string, unknown>,
    delimiters: [string, string] = ['[[', ']]']
): T {
    if (typeof value === 'string') {
        return subslate(value, args, {
            startStopPairs: delimiters
        }) as T;
    }

    if (Array.isArray(value))
        return value.map((a) => interpolate(a, args, delimiters)) as T;

    if (isRecord(value)) return interpolateJson(value, args, delimiters) as T;

    return value;
}

/**
 * Replaces JSON string arguments with regex interpolation.
 *
 * @export
 * @param {Record<string, unknown>} args
 * @param {Record<string, unknown>} values
 * @param {[string, string]} [delimiters=['[[', ']]']]
 *
 * @returns {Record<string, unknown>} mutated args
 */
export function interpolateJson(
    values: Record<string, unknown>,
    args: Record<string, unknown>,
    delimiters: [string, string] = ['[[', ']]']
): Record<string, unknown> {
    for (const key in values)
        values[key] = interpolate(values[key], args, delimiters);

    return values;
}
