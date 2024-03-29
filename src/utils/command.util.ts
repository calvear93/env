import chalk from 'chalk';
import merge from 'merge-deep';
import { join } from 'node:path';
import { Arguments } from 'yargs';
import { CommandArguments } from 'arguments';
import { EnvCommandArguments } from 'commands/env.command';
import { EnvProviderConfig, EnvProviderResult } from '../interfaces';
import {
	createValidators,
	interpolate,
	logger,
	readJson,
	schemaFrom,
	writeJson
} from '../utils';

/**
 * Injects config to command arguments from file.
 *
 * @param {Record<string, unknown>} argv
 * @param {[string, string]} delimiters
 */
export async function loadConfigFile(
	argv: Record<string, unknown>,
	delimiters: [string, string]
): Promise<void> {
	if (typeof argv.configFile === 'string') {
		const path = interpolate(argv.configFile, argv, delimiters);
		const [config, success] = await readJson(path);

		if (success) {
			for (const key in config) argv[key] ??= config[key];
		} else {
			logger.silly(
				`config file ${chalk.underline.yellow(
					path
				)} not found, using defaults`
			);
		}
	}
}

/**
 * Extracts subcommand from command line parameters.
 *
 * @export
 * @param {string[]} rawArgv process.argv.slice(2)
 * @param {[string, string]} delimiters
 *
 * @returns {string[]} subcommand for wrap if exists
 */
export function getSubcommand(rawArgv: string[], delimiters: [string, string]) {
	let subcommand: string[] = [];

	// subcommand delimiter indexes
	const begin = rawArgv.indexOf(delimiters[0]);
	const count = rawArgv.lastIndexOf(delimiters[1]) - begin;

	// calculates subcommand surrounded by delimiters
	if (begin > 0) {
		subcommand =
			count > 0
				? rawArgv.splice(begin, count + 1).slice(1, -1)
				: rawArgv.splice(begin).slice(1);
	}

	return subcommand;
}

/**
 * Loads providers JSON schema from file.
 *
 * @param {Record<string, unknown>} argv
 * @param {[string, string]} delimiters
 *
 * @returns {Promise<Record<string, unknown>>}
 */
export async function loadSchemaFile(
	argv: Record<string, unknown>,
	delimiters: [string, string]
): Promise<Record<string, unknown> | undefined> {
	if (typeof argv.schemaFile === 'string') {
		const path = interpolate(argv.schemaFile, argv, delimiters);
		const [schema, success] = await readJson(path);

		return success ? schema : undefined;
	}

	return undefined;
}

/**
 * Reads project package.json.
 *
 * @export
 * @returns {Promise<Record<string, unknown>> | never}
 */
export async function loadProjectInfo(
	relativePath = ''
): Promise<Record<string, unknown>> {
	try {
		return await import(join(process.cwd(), relativePath, 'package.json'));
	} catch {
		logger.warn(
			`project file ${chalk.underline.yellow('package.json')} not found`
		);

		return {};
	}
}

/**
 * Executes load functions from provider handlers.
 *
 * @param {EnvProviderConfig[]} providers
 * @param {Partial<Arguments<EnvCommandArguments>>} argv
 *
 * @returns {EnvProviderResult[]}
 */
export function loadVariablesFromProviders(
	providers: EnvProviderConfig[],
	argv: Partial<Arguments<EnvCommandArguments>>
): Promise<EnvProviderResult[]> {
	if (!providers) return Promise.resolve([]) as Promise<EnvProviderResult[]>;

	return Promise.all(
		providers.map(({ handler: { key, load }, config }) => {
			logger.silly(`executing ${chalk.yellow(key)} provider`);

			const value = load(argv, config);

			if (value instanceof Promise) {
				return value.then((value) => ({
					key,
					config,
					value
				}));
			} else {
				return { key, config, value };
			}
		})
	);
}

/**
 * Flattern environment provider results.
 *
 * @param {EnvProviderResult[]} results
 * @param {Partial<Arguments<EnvCommandArguments>>} argv
 *
 * @throws {Error} on schema validation failed
 *
 * @returns {EnvProviderResult[]} flatten results
 */
export function flatResults(
	results: EnvProviderResult[]
): EnvProviderResult[] | never {
	return results.flatMap(({ value }) => {
		if (Array.isArray(value)) value = merge({}, ...value);

		return value;
	});
}

/**
 * Flattern and validates environment provider results.
 *
 * @param {EnvProviderResult[]} results
 * @param {Partial<Arguments<EnvCommandArguments>>} argv
 *
 * @throws {Error} on schema validation failed
 *
 * @returns {EnvProviderResult[]}
 */
export function flatAndValidateResults(
	results: EnvProviderResult[],
	argv: Partial<Arguments<EnvCommandArguments>>
): EnvProviderResult[] | never {
	if (!argv.schemaValidate) return flatResults(results);

	const validators = createValidators(argv.schema!, argv.detectFormat);

	return results.flatMap(({ key, value }) => {
		if (Array.isArray(value)) value = merge({}, ...value);

		const validator = validators![key];

		if (!validator || validator?.(value)) return value;

		logger.error(
			`schema validation failed for ${chalk.yellow(key)}`,
			validator.errors
		);

		throw new Error(`schema validation failed for ${key}`);
	});
}

/**
 * Creates or updates JSON schema from
 * environment variables grouped by provider key.
 *
 * @export
 * @param {EnvProviderResult[]} env
 * @param {Arguments<EnvCommandArguments>} argv
 *
 * @returns {Promise<object>} JSON schema grouped by provider key.
 */
export async function generateSchemaFrom(
	env: EnvProviderResult[],
	argv: Arguments<CommandArguments>
): Promise<object> {
	const { resolve, nullable, detectFormat, schemaFile } = argv;

	// generates schemas from proviers results
	let schema = env.reduce((schema, { key, value }) => {
		const env = Array.isArray(value) ? merge({}, ...value) : value;

		schema[key] = schemaFrom(env, {
			nullable,
			strings: { detectFormat }
		});

		return schema;
	}, {} as Record<string, unknown>);

	if (resolve === 'merge') schema = merge(argv.schema, schema);

	await writeJson(schemaFile, schema, true);

	return schema;
}
