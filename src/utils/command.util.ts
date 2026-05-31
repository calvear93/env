import merge from 'merge-deep';
import { readFileSync } from 'node:fs';
import Path from 'node:path';
import pc from 'picocolors';
import type { Arguments } from 'yargs';
import type { CommandArguments } from '../arguments.js';
import type { EnvCommandArguments } from '../commands/env.command.js';
import type {
	EnvProviderConfig,
	EnvProviderResult,
} from '../interfaces/index.js';
import {
	createValidators,
	flatten,
	interpolate,
	logger,
	readJson,
	schemaFrom,
	writeJson,
} from './index.js';

/**
 * Injects config to command arguments from file.
 *
 * @param {Record<string, unknown>} argv
 * @param {[string, string]} delimiters
 */
export async function loadConfigFile(
	argv: Record<string, unknown>,
	delimiters: [string, string],
): Promise<void> {
	if (typeof argv.configFile === 'string') {
		const path = interpolate(argv.configFile, argv, delimiters);
		const [config, success] = await readJson(path);

		if (success) for (const key in config) argv[key] ??= config[key];
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
	delimiters: [string, string],
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
export function loadProjectInfo(
	relativePath = '',
): Promise<Record<string, unknown>> {
	try {
		const filePath = Path.join(process.cwd(), relativePath, 'package.json');

		return Promise.resolve(
			JSON.parse(readFileSync(filePath, 'utf8')) as Record<
				string,
				unknown
			>,
		);
	} catch {
		logger.warn(
			`project file ${pc.underline(pc.yellow('package.json'))} not found`,
		);

		return Promise.resolve({});
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
	argv: Partial<Arguments<EnvCommandArguments>>,
): Promise<EnvProviderResult[]> {
	if (!providers) return Promise.resolve([]) as Promise<EnvProviderResult[]>;

	return Promise.all(
		providers.map(async ({ config, handler: { key, load } }) => {
			logger.silly(`executing ${pc.yellow(key)} provider`);

			const value = await load(argv, config);

			return { config, key, value };
		}),
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
	results: EnvProviderResult[],
	nestingDelimiter = '__',
): EnvProviderResult[] | never {
	return results.flatMap(({ value }) => {
		if (Array.isArray(value))
			return merge({}, ...value.map((v) => flatten(v, nestingDelimiter)));

		return flatten(value, nestingDelimiter);
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
export async function flatAndValidateResults(
	results: EnvProviderResult[],
	argv: Partial<Arguments<EnvCommandArguments>>,
): Promise<EnvProviderResult[]> {
	if (!argv.schemaValidate)
		return flatResults(results, argv.nestingDelimiter);

	const validators = await createValidators(argv.schema!, argv.detectFormat);

	return results.flatMap(({ key, value }) => {
		let baseValue = value;
		if (Array.isArray(value)) {
			value = merge({}, ...value);
			baseValue = merge(
				{},
				...baseValue.map((v: any) => flatten(v, argv.nestingDelimiter)),
			);
		} else {
			baseValue = flatten(value, argv.nestingDelimiter);
		}

		const validator = validators![key];

		if (!validator || validator?.(value)) return baseValue;

		logger.error(
			`schema validation failed for ${pc.yellow(key)}`,
			validator?.errors,
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
	argv: Arguments<CommandArguments>,
): Promise<object> {
	const { detectFormat, nullable, resolve, schemaFile } = argv;

	// generates schemas from providers results
	const schemaEntries: Record<string, unknown> = {};
	for (const { key, value } of env) {
		const merged = Array.isArray(value) ? merge({}, ...value) : value;

		schemaEntries[key] = await schemaFrom(merged, {
			nullable,
			strings: { detectFormat },
		});
	}

	let schema: Record<string, unknown> = schemaEntries;

	if (resolve === 'merge') schema = merge(argv.schema, schema);

	await writeJson(schemaFile, schema, true);

	return schema;
}
