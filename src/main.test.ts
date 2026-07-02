import { describe, expect, it, vi } from 'vitest';

const exec = vi.fn();
const normalizeRawArgv = vi.fn(() => ['normalized', 'argv']);

vi.mock('./exec.js', () => ({ exec }));
vi.mock('./utils/index.js', () => ({ normalizeRawArgv }));

describe('main', () => {
	it('normalizes process.argv and delegates to exec', async () => {
		await import('./main.js');

		expect(normalizeRawArgv).toHaveBeenCalledWith(process.argv);
		expect(exec).toHaveBeenCalledWith(['normalized', 'argv']);
	});
});
