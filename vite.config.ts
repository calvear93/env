import { fileURLToPath } from 'node:url';
import type { UserConfigExport } from 'vite';
import dts from 'vite-plugin-dts';
import tsconfig from './tsconfig.json' with { type: 'json' };

const { compilerOptions } = tsconfig;

const root = fileURLToPath(new URL('.', import.meta.url));
const entry = (path: string): string =>
	fileURLToPath(new URL(path, import.meta.url));

const SHEBANG = '#!/usr/bin/env node';

// keep every dependency and node builtin external (library build)
const isExternal = (id: string): boolean =>
	!id.startsWith('.') &&
	!id.startsWith('/') &&
	!id.startsWith('src/') &&
	!id.startsWith(root) &&
	!/^[a-z]:[/\\]/i.test(id);

export default {
	clearScreen: false,
	build: {
		sourcemap: compilerOptions.sourceMap,
		target: compilerOptions.target,
		lib: {
			formats: ['es'],
			entry: {
				index: entry('src/index.ts'),
				main: entry('src/main.ts'),
				'utils/index': entry('src/utils/index.ts'),
			},
		},
		rolldownOptions: {
			external: isExternal,
			output: {
				entryFileNames: '[name].js',
				preserveModules: true,
				preserveModulesRoot: 'src',
				banner: (chunk) =>
					chunk.fileName === 'main.js' ? SHEBANG : '',
			},
		},
	},
	plugins: [
		dts({
			entryRoot: 'src',
			exclude: ['src/**/*.{test,spec}.ts'],
			include: ['src'],
		}),
	],
	// vite 8 resolves tsconfig `paths` natively (replaces vite-tsconfig-paths)
	resolve: {
		tsconfigPaths: true,
	},
} satisfies UserConfigExport;
