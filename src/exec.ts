import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import pc from 'picocolors';
import yargs from 'yargs';
import type { Arguments } from 'yargs';
import { Parser } from 'yargs/helpers';
import { args } from './arguments.js';
import type { CommandArguments } from './arguments.js';
import {
	envCommand,
	exportCommand,
	pullCommand,
	pushCommand,
	schemaCommand,
} from './commands/index.js';
import { IntegratedProviders } from './providers/index.js';
import {
	configureLogger,
	getSubcommand,
	interpolateJson,
	loadConfigFile,
	loadProjectInfo,
	loadSchemaFile,
	logger,
	resolveEnv,
	resolvePath,
	ui,
} from './utils/index.js';

type Alias = string[] | string;

/**
 * Preload basic config from command line and config file.
 *
 * @param {string[]} rawArgv process.argv
 * @param {Partial<yargsParser.Configuration>} parser yargs parser config
 * @param {[string, string]} delimiters
 *
 * @returns {Promise<Partial<CommandArguments>>} preloaded config
 */
async function preloadConfig(
	rawArgv: string[],
	parser: Record<string, unknown>,
	delimiters: [string, string],
): Promise<Partial<CommandArguments>> {
	// preload base config
	const preloadedArgv = Parser.detailed(rawArgv, {
		array: ['modes', 'logMaskAnyRegEx', 'logMaskValuesOfKeys'],
		boolean: ['help'],
		configuration: parser as any,
		string: ['root', 'env', 'configFile', 'schemaFile', 'logLevel'],
		// every shared option's alias, plus command-specific options that need
		// the same CLI-over-config-file protection in the middleware below
		// (schemaValidate/validate isn't in `args` — it's declared per-command
		// in env.command.ts/export.command.ts with the same alias shape).
		alias: {
			...(Object.fromEntries(
				Object.entries(args)
					.filter(([, option]) => option.alias)
					.map(([key, option]) => [key, option.alias as Alias]),
			) as Record<string, Alias>),
			schemaValidate: 'validate',
		},
		default: {
			configFile: args.configFile.default,
			root: args.root.default,
		},
	}).argv;

	// loads configuration file
	await loadConfigFile(preloadedArgv, delimiters);

	preloadedArgv.logLevel ??= args.logLevel.default;
	preloadedArgv.logMaskAnyRegEx ??= args.logMaskAnyRegEx.default;
	preloadedArgv.logMaskValuesOfKeys ??= args.logMaskValuesOfKeys.default;
	preloadedArgv.providers ??= args.providers.default;

	const { logLevel, logMaskAnyRegEx, logMaskValuesOfKeys } = preloadedArgv;

	// logging level
	configureLogger(logger, {
		maskAnyRegEx: logMaskAnyRegEx,
		maskValuesOfKeys: logMaskValuesOfKeys,
		minLevel: logLevel,
	});

	return preloadedArgv;
}

/**
 * Command preprocessing and lib info
 * reading from package.json.
 * Preloads config file and setup basic config.
 *
 * @param {string[]} rawArgv process.argv
 */
export async function exec(rawArgv: string[]) {
	// reads some lib base config from package.json
	const pkg = JSON.parse(
		readFileSync(
			fileURLToPath(new URL('package.json', import.meta.url)),
			'utf8',
		),
	) as { config: Record<string, any>; version: string };
	const { config, version } = pkg;

	// execs yargs
	const subcommand = getSubcommand(rawArgv, config.delimiters.subcommand);

	const preloadedArgv = await preloadConfig(
		rawArgv,
		config.parser,
		config.delimiters.template,
	);

	// infers env from npm script name (npm_lifecycle_event) when
	// not provided by -e nor config file; skipped for --help
	if (!preloadedArgv.help)
		await resolveEnv(preloadedArgv, config.delimiters.template);

	const { env, help, modes, providers } = preloadedArgv;

	if (help) build(rawArgv, preloadedArgv, subcommand, config, version);

	if (!Array.isArray(providers) || providers.length === 0) {
		logger.error('no providers found');

		process.exit(1);
	}

	ui.header(version, env, modes);

	// read loaders from config
	for (const provider of providers!) {
		try {
			logger.debug(`using ${pc.yellow(provider.path)} provider`);

			if (!provider.type || provider.type === 'integrated') {
				provider.handler = IntegratedProviders[provider.path];
			} else {
				const { default: module } = await import(
					provider.type === 'module'
						? provider.path
						: resolvePath(provider.path)
				);

				provider.handler = module;
			}
		} catch {
			logger.error(
				`${pc.yellow(
					provider.path,
				)} provider not found or not compatible`,
			);

			process.exit(1);
		}
	}

	build(rawArgv, preloadedArgv, subcommand, config, version);
}

/**
 * Builds commands and execs Yargs.
 *
 * @param {string[]} rawArgv process.argv.slice(2)
 * @param {Partial<Arguments<CommandArguments>>} preloadedArgv
 * @param {string[]} subcommand subcommand for wrap if exists
 * @param {Record<string, any>} config lib config from package.json
 * @param {string} version lib version from package.json
 */
function build(
	rawArgv: string[],
	preloadedArgv: Partial<Arguments<CommandArguments>>,
	subcommand: string[],
	config: Record<string, any>,
	version = 'unknown',
): void {
	const versionTag = pc.dim(`v${version}`);
	const banner = [
		'',
		`${pc.bold(pc.yellow('⚡ env'))} ${versionTag}  ${pc.dim('· environment variables made easy')}`,
		'',
		`${pc.bold('Usage:')} $0 [command] [options..] ${pc.dim(': <subcmd> :')} [options..]`,
	].join('\n');
	const epilog = [
		`${pc.dim('Run')} ${pc.cyan('env <command> --help')} ${pc.dim('for command-specific options.')}`,
		`${pc.dim('Use')} ${pc.cyan('--log debug')} ${pc.dim('to inspect the resolved environment (secrets stay masked).')}`,
	].join('\n');

	const builder = yargs(rawArgv)
		.strict()
		.scriptName('env')
		.version(version)
		.detectLocale(false)
		.showHelpOnFail(false)
		.parserConfiguration(config.parser)
		.wrap(Math.min(110, process.stdout.columns ?? 110))
		.usage(banner)
		.epilog(epilog)
		.options(args)
		.middleware(async (argv): Promise<void> => {
			// in case of subcommand argument for main
			if (subcommand?.length > 0) argv.subcmd = subcommand;

			// merges preloaded args, preserving booleans already
			// typed by yargs (preload parser reads them as strings)
			for (const key in preloadedArgv) {
				const value = preloadedArgv[key];

				if (
					typeof argv[key] === 'boolean' &&
					(value === 'true' || value === 'false')
				)
					continue;

				argv[key] = value;
			}

			logger.silly(
				'interpolating arguments surrounded by',
				pc.bold(
					pc.yellow(
						`${config.delimiters.template[0]} ${config.delimiters.template[1]}`,
					),
				),
			);

			const subcmdAux = argv.subcmd as string[];
			// applies string templating with current vars
			interpolateJson(argv, argv, config.delimiters.template);

			if (Array.isArray(argv.subcmd)) {
				// fix for argv interpolation pre env interpolation for subcommand
				for (const index in argv.subcmd) {
					if (argv.subcmd[index]?.includes('undefined'))
						argv.subcmd[index] = subcmdAux[index];
				}
			}

			logger.silly('config loaded:', argv);

			// loads environment JSON schema if exists
			// and current project info from package.json
			[argv.projectInfo, argv.schema] = await Promise.all([
				loadProjectInfo((argv.packageJson ?? argv.pkg) as string),
				loadSchemaFile(argv, config.delimiters.template),
			]);

			if (argv.schemaValidate) {
				argv.schemaValidate = !!argv.schema;

				if (argv.schemaValidate)
					logger.silly('schema loaded:', argv.schema);
			}
		});

	// integrated commands builder
	builder.command(envCommand);
	builder.command(exportCommand);
	builder.command(pullCommand);
	builder.command(pushCommand);
	builder.command(schemaCommand);

	const { providers } = preloadedArgv;

	// extends command from plugins
	for (const { handler } of providers!)
		if (handler?.builder) handler.builder(builder);

	// executes command processing
	void builder.parse();
}
