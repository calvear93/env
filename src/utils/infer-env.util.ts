import { readdir } from 'node:fs/promises';
import pc from 'picocolors';
import type { Arguments } from 'yargs';
import type { CommandArguments } from '../arguments.js';
import { interpolate, logger, readJson } from './index.js';

/** appsettings.json section keys. */
export const SECTION_DEFAULT = '|DEFAULT|';
export const SECTION_ENV = '|ENV|';
export const SECTION_LOCAL = '|LOCAL|';
export const SECTION_MODE = '|MODE|';

// filename → env patterns; appsettings.<x>.json is ambiguous with
// per-mode files, so the caller filters matches against |MODE| keys
const ENV_FILE_REGEXES = [
	/^appsettings\.([^.]+)\.local\.json$/,
	/^appsettings\.([^.]+)\.json$/,
	/^([^.]+)\.local\.env\.json$/,
	/^([^.]+)\.env\.json$/,
];

/**
 * Infers the environment from the npm script name
 * (npm_lifecycle_event), i.e. "start:dev" → "dev".
 *
 * @export
 * @param {string | undefined} lifecycleEvent npm script name
 *
 * @returns {string | undefined} environment, or undefined
 *  when there is no ':' suffix (i.e. "preview") or the CLI
 *  was invoked outside an npm script
 */
export function inferEnvFromScript(
	lifecycleEvent: string | undefined,
): string | undefined {
	if (!lifecycleEvent?.includes(':')) return undefined;

	const env = lifecycleEvent.slice(lifecycleEvent.lastIndexOf(':') + 1);

	return env || undefined;
}

/**
 * Discovers the environments defined in the workspace, as the union of
 * the |ENV| and |LOCAL| section keys of appsettings.json and the per-env
 * provider files found in the root folder (appsettings.<env>.json,
 * appsettings.<env>.local.json, <env>.env.json, <env>.local.env.json).
 *
 * @export
 * @param {Partial<Arguments<CommandArguments>>} argv preloaded arguments
 * @param {[string, string]} delimiters template delimiters
 *
 * @returns {Promise<Set<string>>} known environments
 */
export async function discoverEnvironments(
	argv: Partial<Arguments<CommandArguments>>,
	delimiters: [string, string],
): Promise<Set<string>> {
	const { modes = [], root = 'env' } = argv;
	const known = new Set<string>();

	const envFile = interpolate(
		(argv.envFile as string | undefined) ?? `${root}/appsettings.json`,
		argv,
		delimiters,
	);
	const [appsettings] = await readJson(envFile);

	for (const key in appsettings[SECTION_ENV]) known.add(key);
	for (const key in appsettings[SECTION_LOCAL]) known.add(key);

	const knownModes = new Set<string>([
		...Object.keys(appsettings[SECTION_MODE] ?? {}),
		...modes,
	]);

	let files: string[];
	try {
		files = await readdir(root);
	} catch {
		// root folder may not exist
		return known;
	}

	for (const file of files) {
		for (const regex of ENV_FILE_REGEXES) {
			const env = regex.exec(file)?.[1];

			if (!env) continue;

			if (!file.startsWith('appsettings.') || !knownModes.has(env))
				known.add(env);

			break;
		}
	}

	return known;
}

/**
 * Resolves argv.env when not provided by -e nor config file,
 * inferring it from the npm script name (npm_lifecycle_event)
 * and validating it against the known environments.
 *
 * Validation rules:
 * - explicit env unknown → warning, continues
 * - inferred env unknown → fatal error listing known environments
 * - no known environments → inference is discarded (debug log)
 *
 * Mutates argv so build()'s middleware propagates the resolved
 * env to the main yargs parse.
 *
 * @export
 * @param {Partial<Arguments<CommandArguments>>} argv preloaded arguments
 * @param {[string, string]} delimiters template delimiters
 */
export async function resolveEnv(
	argv: Partial<Arguments<CommandArguments>>,
	delimiters: [string, string],
): Promise<void> {
	const script = process.env.npm_lifecycle_event;
	const inferred = argv.env ? undefined : inferEnvFromScript(script);

	if (!argv.env && !inferred) return;

	const known = await discoverEnvironments(argv, delimiters);

	if (argv.env) {
		if (known.size > 0 && !known.has(argv.env)) {
			logger.warn(
				`environment ${pc.yellow(argv.env)} is not defined,`,
				`known environments: ${[...known].sort().join(', ')}`,
			);
		}

		return;
	}

	if (known.size === 0) {
		logger.debug(
			`environment inference from npm script ${pc.yellow(script!)} skipped,`,
			'no environments found in workspace',
		);

		return;
	}

	if (!known.has(inferred!)) {
		logger.error(
			`environment ${pc.red(inferred!)} inferred from npm script ${pc.yellow(script!)} is not defined,`,
			`known environments: ${[...known].sort().join(', ')},`,
			'use -e explicitly or define it in appsettings.json or a provider file',
		);

		process.exit(1);
	}

	argv.env = inferred;

	logger.info(
		`environment ${pc.bold(pc.green(inferred!))} inferred from npm script ${pc.yellow(script!)}`,
	);
}
