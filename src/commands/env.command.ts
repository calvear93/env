import merge from 'merge-deep';
import { spawn } from 'node:child_process';
import type { CommandModule } from 'yargs';
import type { CommandArguments } from '../arguments.js';
import {
	createValidator,
	flatResults,
	flatSchema,
	flatten,
	interpolate,
	loadVariablesFromProviders,
	logger,
	normalize,
	ui,
} from '../utils/index.js';

export interface EnvCommandArguments extends CommandArguments {
	// whether validate schema before injecting variables
	schemaValidate: boolean;
	// command for execute after inject environment variables.
	// Should be prefixed or surrounded by ':' character.
	subcmd: string[];
}

/**
 * Main command.
 * Injects environment variables into process.env.
 *
 * @example [>_]: env -e dev -m debug : npm start
 */
export const envCommand: CommandModule<any, EnvCommandArguments> = {
	command: '$0 [options..] [: <subcmd> :]',
	describe: 'Inject environment variables into a process and run a command',
	builder: (builder) => {
		builder
			.options({
				schemaValidate: {
					alias: 'validate',
					default: true,
					describe: 'Whether validates variables using JSON schema',
					type: 'boolean',
				},
				subcmd: {
					describe: 'Command for inject environment variables',
					type: 'array',
				},
			})
			.example(
				'env -e dev -m test unit : npm test',
				'Loads "dev" environment variables, in "test" and "unit" modes, for "npm start" command',
			)
			.example(
				'env -e dev -m debug : npm start : -c my-config.json',
				'Loads "dev" environment variables, in "debug" mode, for "npm test" command and custom config file',
			)
			.example(
				'env -e dev -m debug -c [[root]]/[[env]].env.json : npm start',
				'Loads custom config file placed in root folder and named same as the env',
			)
			.check((argv): boolean => {
				// special check for custom argument
				if (argv._.length === 0 && !argv.subcmd) {
					logger.error(
						'No one subcommand provided for exec surrounded by :',
					);

					process.exit(1);
				}

				return true;
			});

		return builder;
	},
	handler: async ({ expand, providers, schemaValidate, ...argv }) => {
		const started = performance.now();

		// kick off validator build (lazy-imports AJV) in parallel with provider I/O
		const validatorPromise = schemaValidate
			? buildEnvValidator(providers, argv)
			: undefined;

		const results = await loadVariablesFromProviders(providers, argv);

		// per-provider variable counts
		for (const { key, value } of results) {
			const flat = Array.isArray(value)
				? merge(
						{},
						...value.map((v: any) =>
							flatten(v, argv.nestingDelimiter),
						),
					)
				: flatten(value, argv.nestingDelimiter);

			ui.provider(key, Object.keys(flat).length);
		}

		let env = merge(
			{ NODE_ENV: 'development' },
			...flatResults(results, argv.nestingDelimiter),
		);

		if (validatorPromise) {
			const validator = await validatorPromise;

			if (!validator(env)) {
				logger.error('schema validation failed', validator.errors);

				process.exit(1);
			}
		}

		env = normalize(env, argv.nestingDelimiter, argv.arrayDescomposition);
		if (expand) {
			env = interpolate(env, env);
			argv.subcmd = interpolate(argv.subcmd, env);
		}

		ui.variables(env);

		// loads env vars to process.env
		for (const varname in env) process.env[varname] = String(env[varname]);

		ui.summary(Object.keys(env).length, performance.now() - started);

		const cmdProcess = argv.subcmd.join(' ');

		ui.running(cmdProcess);

		spawn(cmdProcess, {
			shell: true,
			stdio: 'inherit',
		}).on('exit', (code) => {
			if (code === 0 || code === null) {
				ui.finished(performance.now() - started);

				return;
			}

			ui.failed(code);
			logger.error('process finished with error');
			process.exit(code);
		});
	},
};

function buildEnvValidator(
	providers: EnvCommandArguments['providers'],
	argv: Partial<EnvCommandArguments>,
) {
	let schema = {};

	for (const {
		handler: { key },
	} of providers) {
		const providerSchema = argv.schema?.[key];

		if (providerSchema)
			schema = Object.assign(
				schema,
				flatSchema(providerSchema, '', argv.nestingDelimiter),
			);
	}

	return createValidator({ properties: schema, type: 'object' });
}
