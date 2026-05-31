import { existsSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

/**
 * Replaces undefined by null in JSON.stringify()
 *
 * @param {string} _ property key
 * @param {any} value property value
 *
 * @returns {any} value
 */
const replacer = (_: string, value: any): any =>
	value === undefined ? null : value;

/**
 * Resolve a relative path for os.
 *
 * @export
 * @param {string} filePath relative path from project root
 *
 * @returns {string} path
 */
export function resolvePath(filePath: string): string {
	const home = os.homedir();

	if (home) filePath = filePath.replace(/^~($|\/|\\)/, `${home}$1`);

	return path.resolve(process.cwd(), filePath);
}

/**
 * Reads and parses a JSON file.
 *
 * @export
 * @template T
 * @param {string} path
 *
 * @returns {Promise<[Record<string, any>, boolean]>}
 */
export async function readJson<T = Record<string, any>>(
	path: string,
): Promise<[Record<string, any> | T, boolean]> {
	try {
		return [JSON.parse(await readFile(path, 'utf8')), true];
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code === 'ENOENT')
			return [{}, false];

		throw error; // invalid JSON or other IO error must still surface
	}
}

/**
 * Saves a JSON into a file.
 *
 * @export
 * @param {string} path
 * @param {unknown} content
 * @param {false} overwrite
 * @param {false} undefinedAsNull replaces undefined by null
 *
 * @returns {Promise<boolean>}
 */
export async function writeJson(
	path: string,
	content: Record<string, unknown>,
	overwrite = false,
	undefinedAsNull = false,
): Promise<boolean> {
	const exists = existsSync(path);

	if (exists && !overwrite) return false;

	await writeFile(
		path,
		`${JSON.stringify(
			content,
			undefinedAsNull ? replacer : undefined,
			4,
		)}\n`,
		'utf8',
	);

	return true;
}

/**
 * Saves a JSON into a file as dotenv.
 *
 * @export
 * @param {string} path
 * @param {unknown} content
 * @param {false} overwrite
 *
 * @returns {Promise<boolean>}
 */
export async function writeEnvFromJson(
	path: string,
	content: Record<string, unknown>,
	overwrite = false,
	quotes = false,
): Promise<boolean> {
	const exists = existsSync(path);

	if (exists && !overwrite) return false;

	let data = '';

	for (const key in content) {
		let value = content[key];
		if (quotes) value = `"${value}"`;

		data += `${key}=${value}\n`;
	}

	await writeFile(path, data, 'utf8');

	return true;
}
