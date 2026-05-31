// silence picocolors in unit tests for stable string assertions.
import { beforeAll } from 'vitest';

beforeAll(() => {
	process.env.NO_COLOR = '1';
	process.env.FORCE_COLOR = '0';
});
