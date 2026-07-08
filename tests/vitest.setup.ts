// silence picocolors in unit tests for stable string assertions.
import { beforeAll } from 'vitest';

beforeAll(() => {
	process.env.NO_COLOR = '1';
	process.env.FORCE_COLOR = '0';

	// pnpm injects the running script name (i.e. "test:cov"), which would
	// trigger env inference from npm_lifecycle_event inside the tests
	delete process.env.npm_lifecycle_event;
});
