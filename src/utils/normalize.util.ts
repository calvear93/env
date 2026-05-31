/**
 * Flatten a object keeping depth path
 * in key using __ as level separator.
 *
 * @param {Record<string, any>} obj
 * @param {string} nestingDelimiter char for delimit nesting levels
 * @param {string} pkey first level key
 *
 * @returns {Record<string, unknown>} flattened object
 */
export function flatten(
	obj: Record<string, any>,
	nestingDelimiter = '__',
	pkey = '',
): Record<string, unknown> {
	const flattened: Record<string, unknown> = {};

	for (let key in obj) {
		const value = obj[key];
		const type = typeof value;

		if (value === undefined || type === 'function') continue;

		// skipped property
		if (key[0] === '#') continue;
		key = pkey + key;

		if (value === null || type !== 'object' || Array.isArray(value)) {
			flattened[key] = value;

			continue;
		}

		Object.assign(
			flattened,
			flatten(value, nestingDelimiter, `${key}${nestingDelimiter}`),
		);
	}

	return flattened;
}

/**
 * Normalizes env object, converts arrays in list strings,
 * only primitives types array,
 * and removes $ global character from keys.
 *
 * @param {Record<string, any>} obj
 * @param {string} nestingDelimiter char for delimit nesting levels
 * @param {boolean} arrayDescomposition serialize or break down arrays
 * @param {string} pkey first level key
 *
 * @returns {Record<string, unknown>} normalized object
 */
export function normalize(
	obj: Record<string, any>,
	nestingDelimiter = '__',
	arrayDescomposition = false,
	pkey = '',
): Record<string, unknown> {
	const flattened: Record<string, unknown> = {};

	for (let key in obj) {
		const value = obj[key];
		const type = typeof value;

		if (value === null || value === undefined || type === 'function')
			continue;

		// shared/global keys are prefixed with `$`; strip it for injection
		key = pkey + (key[0] === '$' ? key.slice(1) : key);

		if (type !== 'object') {
			flattened[key] = value;

			continue;
		}

		if (Array.isArray(value)) {
			normalizeArray(
				flattened,
				key,
				value,
				nestingDelimiter,
				arrayDescomposition,
			);
		} else {
			Object.assign(
				flattened,
				normalize(
					value,
					nestingDelimiter,
					arrayDescomposition,
					`${key}${nestingDelimiter}`,
				),
			);
		}
	}

	return flattened;
}

/**
 * Flatten and normalizes an array.
 *
 * @param {Record<string, unknown>} flattened
 * @param {string} key
 * @param {any[]} value
 * @param {string} [nestingDelimiter='__']
 * @param {boolean} [arrayDescomposition=false]
 */
function normalizeArray(
	flattened: Record<string, unknown>,
	key: string,
	value: any[],
	nestingDelimiter = '__',
	arrayDescomposition = false,
): void {
	if (arrayDescomposition) {
		key = `${key}${nestingDelimiter}`;

		for (const [i, item] of value.entries()) {
			if (typeof item === 'object') {
				Object.assign(
					flattened,
					normalize(
						item,
						nestingDelimiter,
						arrayDescomposition,
						`${key}${i}${nestingDelimiter}`,
					),
				);
			} else {
				flattened[`${key}${i}`] = item;
			}
		}
	} else {
		flattened[key] = value.filter((v) => typeof v !== 'object').join(',');
	}
}
