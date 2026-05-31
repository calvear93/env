import { exec } from './exec.js';
import { normalizeRawArgv } from './utils/index.js';

void exec(normalizeRawArgv(process.argv));
