import { existsSync, readFileSync } from 'fs';

export function readJson<T = unknown>(path: string): [T | object, boolean] {
    if (!existsSync(path)) return [{}, false];

    return [JSON.parse(readFileSync(path, 'utf-8')), true];
}
