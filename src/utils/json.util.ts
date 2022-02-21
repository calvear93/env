import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';

export function readJson<T = unknown>(path: string): [T | object, boolean] {
    if (!existsSync(path)) return [{}, false];

    return [JSON.parse(readFileSync(path, 'utf-8')), true];
}

export function writeJson(
    path: string,
    content: unknown,
    overwrite: false
): boolean {
    if (existsSync(path) && !overwrite) return false;

    mkdirSync(path);

    if (content && typeof content !== 'string')
        content = content ? JSON.stringify(content) : '';

    writeFileSync(path, content as string, 'utf-8');

    return true;
}
