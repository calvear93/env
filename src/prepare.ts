import fs from 'fs';
import path from 'path';

/**
 * Initialize required files if they do not exists.
 *
 * @export
 * @param {string} dir
 */
export function prepare(dir: string) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);

        fs.writeFileSync(path.join(dir, 'env.schema.json'), '{}');
    }
}
