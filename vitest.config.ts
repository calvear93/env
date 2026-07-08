import type { ViteUserConfig } from 'vitest/config';

const REPORTS_DIR = '__reports__';

export default {
	clearScreen: false,
	// vite 8 resolves tsconfig `paths` natively (replaces vite-tsconfig-paths)
	resolve: {
		tsconfigPaths: true,
	},
	test: {
		coverage: {
			exclude: ['src/**/index.ts', '**/*.d.ts', '**/*.{test,spec}.ts'],
			include: ['src/**/*.ts'],
			provider: 'v8',
			reporter: ['text', 'text-summary', 'lcov'],
			reportsDirectory: `${REPORTS_DIR}/coverage`,
			thresholds: {
				branches: 100,
				functions: 100,
				lines: 100,
				statements: 100,
			},
		},
		projects: [
			{
				extends: true,
				test: {
					clearMocks: true,
					environment: 'node',
					globals: true,
					include: ['src/**/*.{test,spec}.ts'],
					name: 'unit',
					setupFiles: ['tests/vitest.setup.ts'],
				},
			},
			{
				extends: true,
				test: {
					environment: 'node',
					// int files share the mutable tests/env fixture
					// (pull rewrites dev.env.json), so they must not race
					fileParallelism: false,
					globalSetup: ['tests/global-setup.ts'],
					hookTimeout: 120_000,
					include: ['tests/**/*.int.test.ts'],
					name: 'integration',
					testTimeout: 60_000,
				},
			},
		],
	},
} satisfies ViteUserConfig;
