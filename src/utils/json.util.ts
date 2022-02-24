import { existsSync, mkdirSync } from 'fs';
import { readFile, writeFile } from 'fs/promises';

export async function readJson<T = unknown>(
    path: string
): Promise<[T | object, boolean]> {
    if (!existsSync(path)) return [{}, false];

    return [JSON.parse(await readFile(path, 'utf-8')), true];
}

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
