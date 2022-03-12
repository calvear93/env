import os from 'os';
import path from 'path';
import { existsSync, mkdirSync } from 'fs';
import { readFile, writeFile } from 'fs/promises';

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

    if (home !== undefined)
        filePath = filePath.replace(/^~($|\/|\\)/, `${home}$1`);

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
    path: string
): Promise<[T | Record<string, any>, boolean] | never> {
    if (!existsSync(path)) return [{}, false];

    return [JSON.parse(await readFile(path, 'utf8')), true];
}

/**
 * Saves a JSON into a file.
 *
 * @export
 * @param {string} path
 * @param {unknown} content
 * @param {false} overwrite
 *
 * @returns {Promise<boolean>}
 */
export async function writeJson(
    path: string,
    content: Record<string, unknown>,
    overwrite = false
): Promise<boolean | never> {
    const exists = existsSync(path);

    if (exists && !overwrite) return false;

    !overwrite && mkdirSync(path);

    await writeFile(path, JSON.stringify(content, undefined, 4), 'utf8');

    return true;
}
