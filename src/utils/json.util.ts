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
export async function readJson<T = unknown>(
    path: string
): Promise<[T | Record<string, any>, boolean]> {
    if (!existsSync(path)) return [{}, false];

    return [JSON.parse(await readFile(path, 'utf-8')), true];
}

/**
 * Saves a JSON into a file.
 *
 * @export
 * @param {string} path
 * @param {unknown} content
 * @param {false} overwrite
 *
 * @returns {*}  {Promise<boolean>}
 */
export async function writeJson(
    path: string,
    content: unknown,
    overwrite: false
): Promise<boolean> {
    if (existsSync(path) && !overwrite) return false;

    mkdirSync(path);

    if (content && typeof content !== 'string')
        content = content ? JSON.stringify(content) : '';

    await writeFile(path, content as string, 'utf-8');

    return true;
}
