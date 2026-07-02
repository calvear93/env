import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Fake package.json returned by the readFileSync call in exec.ts
// ---------------------------------------------------------------------------
const FAKE_PKG = JSON.stringify({
	version: '5.0.0-test',
	config: {
		delimiters: { subcommand: [':', ':'], template: ['[[', ']]'] },
		parser: { 'camel-case-expansion': false },
	},
});

// ---------------------------------------------------------------------------
// node:fs – keep everything real except readFileSync (for the pkg.json read).
// existsSync must stay real so loadConfigFile / readJson silently skip missing
// files rather than throwing.
// ---------------------------------------------------------------------------
vi.mock('node:fs', async () => {
	const actual = await vi.importActual<typeof import('node:fs')>('node:fs');
	return {
		...actual,
		readFileSync: vi.fn(() => FAKE_PKG),
	};
});

// ---------------------------------------------------------------------------
// utils – keep all real except loadSchemaFile which we control per-test
// ---------------------------------------------------------------------------
let loadSchemaFileImpl: (argv: any, delimiters: any) => Promise<any> = () =>
	Promise.resolve();

vi.mock('./utils/index.js', async () => {
	const actual =
		await vi.importActual<typeof import('./utils/index.js')>(
			'./utils/index.js',
		);
	return {
		...actual,
		loadSchemaFile: vi.fn((argv: any, delimiters: any) =>
			loadSchemaFileImpl(argv, delimiters),
		),
	};
});

// ---------------------------------------------------------------------------
// yargs – chainable stub.  We capture the middleware callback so we can
// exercise the build() middleware body lines as well.
// ---------------------------------------------------------------------------
let capturedMiddleware: ((argv: any) => Promise<void>) | undefined;
const parse = vi.fn();

const builder: any = {
	command: vi.fn().mockReturnThis(),
	detectLocale: vi.fn().mockReturnThis(),
	epilog: vi.fn().mockReturnThis(),
	options: vi.fn().mockReturnThis(),
	parse,
	parserConfiguration: vi.fn().mockReturnThis(),
	scriptName: vi.fn().mockReturnThis(),
	showHelpOnFail: vi.fn().mockReturnThis(),
	strict: vi.fn().mockReturnThis(),
	usage: vi.fn().mockReturnThis(),
	version: vi.fn().mockReturnThis(),
	wrap: vi.fn().mockReturnThis(),
	middleware: vi.fn().mockImplementation((fn: any) => {
		capturedMiddleware = fn;
		return builder;
	}),
};
vi.mock('yargs', () => ({ default: vi.fn(() => builder) }));

// ---------------------------------------------------------------------------
// Providers – controlled stubs (mutable so tests can swap them)
// ---------------------------------------------------------------------------
const mockIntegratedProviders: Record<string, any> = {
	local: {
		builder: vi.fn(),
		key: 'local',
		load: vi.fn(() => Promise.resolve({})),
	},
};

// use a plain array so tests can clear/push freely
const mockIntegratedProviderConfig: any[] = [{ path: 'local' }];

vi.mock('./providers/index.js', () => ({
	IntegratedProviderConfig: mockIntegratedProviderConfig,
	IntegratedProviders: mockIntegratedProviders,
}));

// ---------------------------------------------------------------------------
// Commands – minimal stubs so builder.command() calls succeed
// ---------------------------------------------------------------------------
vi.mock('./commands/index.js', () => ({
	envCommand: { command: 'env', describe: 'env', handler: vi.fn() },
	exportCommand: { command: 'export', describe: 'export', handler: vi.fn() },
	pullCommand: { command: 'pull', describe: 'pull', handler: vi.fn() },
	pushCommand: { command: 'push', describe: 'push', handler: vi.fn() },
	schemaCommand: { command: 'schema', describe: 'schema', handler: vi.fn() },
}));

// ---------------------------------------------------------------------------
// Dynamically import exec AFTER all vi.mock() registrations
// ---------------------------------------------------------------------------
const { exec } = await import('./exec.js');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function spyExit() {
	return vi.spyOn(process, 'exit').mockImplementation((() => {}) as any);
}

function resetProviders(configs: any[] = [{ path: 'local' }]) {
	mockIntegratedProviderConfig.length = 0;
	for (const c of configs) mockIntegratedProviderConfig.push(c);
}

// base fake argv for middleware invocation
function makeFakeArgv(overrides: Record<string, any> = {}): any {
	return {
		_: [],
		configFile: 'env/settings/settings.json',
		env: 'dev',
		packageJson: '',
		root: 'env',
		schemaFile: 'env/settings/schema.json',
		schemaValidate: false,
		...overrides,
	};
}

// ---------------------------------------------------------------------------
// Tests: happy path
// ---------------------------------------------------------------------------
describe('exec – happy path (integrated provider)', () => {
	beforeEach(() => {
		resetProviders();
		capturedMiddleware = undefined;
		loadSchemaFileImpl = () => Promise.resolve();
	});

	afterEach(() => vi.clearAllMocks());

	it('resolves provider handler and calls builder.parse()', async () => {
		await exec(['node', 'env', '-e', 'dev']);
		expect(parse).toHaveBeenCalledOnce();
		expect(mockIntegratedProviderConfig[0].handler).toBe(
			mockIntegratedProviders.local,
		);
	});

	it('resolves handler when type is explicitly "integrated"', async () => {
		resetProviders([{ path: 'local', type: 'integrated' }]);
		await exec(['node', 'env', '-e', 'dev']);
		expect(mockIntegratedProviderConfig[0].handler).toBe(
			mockIntegratedProviders.local,
		);
	});

	it('logs info with env and modes present', async () => {
		await expect(
			exec(['node', 'env', '-e', 'dev', '-m', 'debug']),
		).resolves.toBeUndefined();
	});

	it('logs info without env or modes (both falsy branches)', async () => {
		await expect(exec(['node', 'env'])).resolves.toBeUndefined();
	});

	it('invokes handler.builder when present', async () => {
		const builderFn = vi.fn();
		const prev = mockIntegratedProviders.local;
		mockIntegratedProviders.local = { ...prev, builder: builderFn };
		await exec(['node', 'env', '-e', 'dev']);
		expect(builderFn).toHaveBeenCalledOnce();
		mockIntegratedProviders.local = prev;
	});

	it('skips handler.builder when not present', async () => {
		const prev = mockIntegratedProviders.local;
		mockIntegratedProviders.local = {
			key: 'local',
			load: vi.fn(() => Promise.resolve({})),
		} as any;
		await expect(
			exec(['node', 'env', '-e', 'dev']),
		).resolves.toBeUndefined();
		mockIntegratedProviders.local = prev;
	});
});

// ---------------------------------------------------------------------------
// Tests: no providers → exit(1)
// ---------------------------------------------------------------------------
describe('exec – no providers → exit(1)', () => {
	afterEach(() => vi.clearAllMocks());

	it('exits 1 when providers array is empty', async () => {
		resetProviders([]);
		const exit = spyExit();
		await exec(['node', 'env', '-e', 'dev']);
		expect(exit).toHaveBeenCalledWith(1);
	});
});

// ---------------------------------------------------------------------------
// Tests: help flag
// ---------------------------------------------------------------------------
describe('exec – help flag short-circuits to build', () => {
	beforeEach(() => resetProviders());
	afterEach(() => vi.clearAllMocks());

	it('calls builder.parse() (via build) when --help is passed', async () => {
		await exec(['node', 'env', '--help']);
		expect(parse).toHaveBeenCalled();
	});
});

// ---------------------------------------------------------------------------
// Tests: module type provider
// ---------------------------------------------------------------------------
describe('exec – "module" type provider', () => {
	beforeEach(() => (loadSchemaFileImpl = async () => {}));
	afterEach(() => vi.clearAllMocks());

	it('assigns handler on successful module import (picocolors)', async () => {
		resetProviders([{ path: 'picocolors', type: 'module' }]);
		await expect(
			exec(['node', 'env', '-e', 'dev']),
		).resolves.toBeUndefined();
		expect(mockIntegratedProviderConfig[0]).toHaveProperty('handler');
		expect(parse).toHaveBeenCalledOnce();
	});

	it('exits 1 when module type import fails', async () => {
		resetProviders([
			{ path: 'nonexistent-module-xyz-99999', type: 'module' },
		]);
		const exit = spyExit();
		await exec(['node', 'env', '-e', 'dev']);
		expect(exit).toHaveBeenCalledWith(1);
	});
});

// ---------------------------------------------------------------------------
// Tests: script type provider
// ---------------------------------------------------------------------------
describe('exec – "script" type provider', () => {
	afterEach(() => vi.clearAllMocks());

	it('exits 1 when script type import (via resolvePath) fails', async () => {
		resetProviders([
			{ path: './nonexistent-script-xyz.js', type: 'script' },
		]);
		const exit = spyExit();
		await exec(['node', 'env', '-e', 'dev']);
		expect(exit).toHaveBeenCalledWith(1);
	});
});

// ---------------------------------------------------------------------------
// Tests: build() middleware callback
// ---------------------------------------------------------------------------
describe('exec – build() middleware callback', () => {
	beforeEach(async () => {
		resetProviders();
		capturedMiddleware = undefined;
		loadSchemaFileImpl = () => Promise.resolve();
		// run exec to capture the middleware function
		await exec(['node', 'env', '-e', 'dev']);
		vi.clearAllMocks();
	});

	afterEach(() => vi.clearAllMocks());

	it('middleware runs without subcommand (subcommand.length === 0)', async () => {
		const fakeArgv = makeFakeArgv();
		await expect(capturedMiddleware!(fakeArgv)).resolves.toBeUndefined();
		expect(fakeArgv).toHaveProperty('projectInfo');
	});

	it('middleware sets argv.subcmd when subcommand is non-empty', async () => {
		// re-capture middleware with a subcommand-bearing exec call
		capturedMiddleware = undefined;
		await exec([
			'node',
			'env',
			'-e',
			'dev',
			':',
			'npm',
			'run',
			'build',
			':',
		]);
		vi.clearAllMocks();

		const fakeArgv = makeFakeArgv();
		await capturedMiddleware!(fakeArgv);
		// getSubcommand extracted ['npm', 'run', 'build'], middleware sets argv.subcmd
		expect(fakeArgv.subcmd).toEqual(['npm', 'run', 'build']);
	});

	it('middleware: subcmd fix loop replaces "undefined" tokens with original (line 211)', async () => {
		// we call capturedMiddleware (captured from a no-subcommand exec) directly.
		// We pre-set fakeArgv.subcmd so it is an array.  Because subcommand.length === 0
		// for this exec call, step-1 does NOT overwrite fakeArgv.subcmd.
		// After Object.assign (preloadedArgv has no subcmd) it stays.
		// interpolateJson leaves 'undefined' as-is (no [[…]] templates).
		// → argv.subcmd[0].includes('undefined') is true → line 211 executes.
		const fakeArgv = makeFakeArgv({ subcmd: ['undefined'] });
		await capturedMiddleware!(fakeArgv);
		// the fix restored the original value (also 'undefined') from subcmdAux
		expect(fakeArgv.subcmd[0]).toBe('undefined');
	});

	it('middleware preserves booleans typed by yargs over preloaded strings', async () => {
		// re-capture middleware with a raw boolean-as-string flag; the preload
		// parser does not know command options, so it reads 'false' as string
		capturedMiddleware = undefined;
		await exec(['node', 'env', '-e', 'dev', '--overwrite=false']);
		vi.clearAllMocks();

		const fakeArgv = makeFakeArgv({ overwrite: false });
		await capturedMiddleware!(fakeArgv);
		// preloadedArgv.overwrite === 'false' must not clobber the boolean
		expect(fakeArgv.overwrite).toBe(false);
	});

	it('middleware sets schemaValidate=false when no schema loaded', async () => {
		const fakeArgv = makeFakeArgv({ schemaValidate: true });
		await capturedMiddleware!(fakeArgv);
		// loadSchemaFile returns undefined → !!undefined = false
		expect(fakeArgv.schemaValidate).toBe(false);
	});

	it('middleware sets schemaValidate=true and logs when schema IS loaded (line 228)', async () => {
		// make loadSchemaFile return a real schema object
		const mockSchema = { properties: {}, type: 'object' };
		loadSchemaFileImpl = () => Promise.resolve(mockSchema);

		const fakeArgv = makeFakeArgv({ schemaValidate: true });
		await capturedMiddleware!(fakeArgv);
		// argv.schema = mockSchema → !!mockSchema = true → schemaValidate stays true
		expect(fakeArgv.schemaValidate).toBe(true);
		expect(fakeArgv.schema).toBe(mockSchema);
	});

	it('middleware uses argv.pkg when argv.packageJson is nullish (covers ?? branch)', async () => {
		// argv.packageJson undefined → falls through ?? to argv.pkg
		const fakeArgv = makeFakeArgv({ packageJson: undefined, pkg: '' });
		await expect(capturedMiddleware!(fakeArgv)).resolves.toBeUndefined();
		expect(fakeArgv).toHaveProperty('projectInfo');
	});
});
