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
    Object.keys(values).forEach((key) => {
        const arg = values[key];

        if (typeof arg === 'string') {
            values[key] = subslate(arg, args, {
                startStopPairs: delimiters
            });
        } else if (Array.isArray(arg)) {
            values[key] = arg.map((a) =>
                subslate(a, args, {
                    startStopPairs: delimiters
                })
            );
        } else if (isRecord(arg)) {
            values[key] = interpolateJson(arg, args, delimiters);
        }
    });

    return args;
}
