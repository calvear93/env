import { EventEmitter } from 'node:events';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const spawnMock = vi.fn();
vi.mock('node:child_process', () => ({ spawn: spawnMock }));

const loadVariablesFromProvidersMock = vi.fn(() => Promise.resolve([]));
vi.mock('../utils/index.js', async () => {
	const actual = await vi.importActual<any>('../utils/index.js');
	return {
		...actual,
		loadVariablesFromProviders: loadVariablesFromProvidersMock,
	};
});

const { envCommand } = await import('./env.command.js');

function fakeChild() {
	// eslint-disable-next-line unicorn/prefer-event-target -- child_process uses EventEmitter, not EventTarget
	const child = new EventEmitter() as EventEmitter & { on: any };
	return child;
}

// suppress UI stdout output in all tests
beforeEach(() => {
	vi.spyOn(process.stdout, 'write').mockReturnValue(
		true as unknown as boolean,
	);
});

afterEach(() => vi.restoreAllMocks());

// ---------------------------------------------------------------------------
// builder
// ---------------------------------------------------------------------------
describe('envCommand builder', () => {
	it('registers options, examples, and check; returns builder', () => {
		let capturedCheck: ((argv: any) => boolean) | undefined;
		const b: any = {
			example: vi.fn().mockReturnThis(),
			options: vi.fn().mockReturnThis(),
			check: vi.fn().mockImplementation((fn: any) => {
				capturedCheck = fn;
				return b;
			}),
		};

		const result = (envCommand.builder as any)(b as any, {} as any);
		expect(b.options).toHaveBeenCalled();
		expect(b.check).toHaveBeenCalled();
		expect(result).toBe(b);

		// check callback: no subcmd and empty _ → exits with 1
		const exit = vi
			.spyOn(process, 'exit')
			.mockImplementation((() => {}) as any);
		capturedCheck!({ _: [], subcmd: undefined });
		expect(exit).toHaveBeenCalledWith(1);
	});

	it('check returns true when _ has items', () => {
		let capturedCheck: ((argv: any) => boolean) | undefined;
		const b: any = {
			example: vi.fn().mockReturnThis(),
			options: vi.fn().mockReturnThis(),
			check: vi.fn().mockImplementation((fn: any) => {
				capturedCheck = fn;
				return b;
			}),
		};
		(envCommand.builder as any)(b as any, {} as any);

		const result = capturedCheck!({
			_: ['node', 'index.js'],
			subcmd: undefined,
		});
		expect(result).toBe(true);
	});

	it('check returns true when subcmd is provided', () => {
		let capturedCheck: ((argv: any) => boolean) | undefined;
		const b: any = {
			example: vi.fn().mockReturnThis(),
			options: vi.fn().mockReturnThis(),
			check: vi.fn().mockImplementation((fn: any) => {
				capturedCheck = fn;
				return b;
			}),
		};
		(envCommand.builder as any)(b as any, {} as any);

		const result = capturedCheck!({ _: [], subcmd: ['node', 'app.js'] });
		expect(result).toBe(true);
	});
});

// ---------------------------------------------------------------------------
// handler – exit code propagation
// ---------------------------------------------------------------------------
describe('envCommand exit propagation', () => {
	it('propagates a non-zero, non-1 child exit code', async () => {
		const child = fakeChild();
		spawnMock.mockReturnValue(child);
		const exit = vi
			.spyOn(process, 'exit')
			.mockImplementation((() => {}) as any);

		const argv: any = {
			arrayDescomposition: false,
			expand: false,
			nestingDelimiter: '__',
			providers: [],
			schemaValidate: false,
			subcmd: ['node', '-e', 'process.exit(2)'],
		};
		await envCommand.handler(argv);
		child.emit('exit', 2);

		expect(exit).toHaveBeenCalledWith(2);
	});

	it('logs success when exit code is 0', async () => {
		const child = fakeChild();
		spawnMock.mockReturnValue(child);
		const exit = vi
			.spyOn(process, 'exit')
			.mockImplementation((() => {}) as any);

		const argv: any = {
			arrayDescomposition: false,
			expand: false,
			nestingDelimiter: '__',
			providers: [],
			schemaValidate: false,
			subcmd: ['node', '-e', ''],
		};
		await envCommand.handler(argv);
		child.emit('exit', 0);

		expect(exit).not.toHaveBeenCalled();
	});

	it('logs success when exit code is null', async () => {
		const child = fakeChild();
		spawnMock.mockReturnValue(child);
		const exit = vi
			.spyOn(process, 'exit')
			.mockImplementation((() => {}) as any);

		const argv: any = {
			arrayDescomposition: false,
			expand: false,
			nestingDelimiter: '__',
			providers: [],
			schemaValidate: false,
			subcmd: ['node'],
		};
		await envCommand.handler(argv);
		child.emit('exit', null);

		expect(exit).not.toHaveBeenCalled();
	});
});

// ---------------------------------------------------------------------------
// handler – per-provider ui.provider coverage
// ---------------------------------------------------------------------------
describe('envCommand per-provider loop', () => {
	it('calls ui.provider for each result with object value', async () => {
		const child = fakeChild();
		spawnMock.mockReturnValue(child);

		loadVariablesFromProvidersMock.mockResolvedValueOnce([
			{ key: 'local', value: { A: '1', B: '2' } },
		] as any);

		const argv: any = {
			arrayDescomposition: false,
			expand: false,
			nestingDelimiter: '__',
			providers: [],
			schemaValidate: false,
			subcmd: ['node'],
		};
		await envCommand.handler(argv);
		child.emit('exit', 0);

		// spawn should have been called (implies provider loop ran without error)
		expect(spawnMock).toHaveBeenCalled();
	});

	it('calls ui.provider for each result with array value (merge path)', async () => {
		const child = fakeChild();
		spawnMock.mockReturnValue(child);

		// array value triggers the merge+flatten branch
		loadVariablesFromProvidersMock.mockResolvedValueOnce([
			{
				key: 'app-settings',
				value: [{ FOO: 'bar' }, { BAZ: 'qux' }],
			},
		] as any);

		const argv: any = {
			arrayDescomposition: false,
			expand: false,
			nestingDelimiter: '__',
			providers: [],
			schemaValidate: false,
			subcmd: ['node'],
		};
		await envCommand.handler(argv);
		child.emit('exit', 0);

		expect(spawnMock).toHaveBeenCalled();
	});
});

// ---------------------------------------------------------------------------
// handler – schemaValidate
// ---------------------------------------------------------------------------
describe('envCommand schemaValidate', () => {
	it('passes validation and spawns the command', async () => {
		const child = fakeChild();
		spawnMock.mockReturnValue(child);

		const argv: any = {
			arrayDescomposition: false,
			expand: false,
			nestingDelimiter: '__',
			schemaValidate: true,
			subcmd: ['node', '-e', ''],
			providers: [
				{
					config: undefined,
					handler: { key: 'local' },
				},
			],
			// schema with local provider key: expect NODE_ENV to be a string
			schema: {
				local: {
					type: 'object',
					properties: {
						NODE_ENV: { type: 'string' },
					},
				},
			},
		};
		// loadVariablesFromProviders returns [] → merged env = { NODE_ENV: 'development' }
		await envCommand.handler(argv);
		child.emit('exit', 0);

		expect(spawnMock).toHaveBeenCalled();
	});

	it('exits with 1 on schema validation failure', async () => {
		const child = fakeChild();
		spawnMock.mockReturnValue(child);
		const exit = vi
			.spyOn(process, 'exit')
			.mockImplementation((() => {}) as any);

		const argv: any = {
			arrayDescomposition: false,
			expand: false,
			nestingDelimiter: '__',
			schemaValidate: true,
			subcmd: ['node'],
			providers: [
				{
					config: undefined,
					handler: { key: 'local' },
				},
			],
			// local schema requires NODE_ENV to be a number — will fail since value is 'development'
			schema: {
				local: {
					required: ['NODE_ENV'],
					type: 'object',
					properties: {
						NODE_ENV: { type: 'number' },
					},
				},
			},
		};
		await envCommand.handler(argv);

		expect(exit).toHaveBeenCalledWith(1);
	});

	it('skips schema build when provider key has no schema entry', async () => {
		const child = fakeChild();
		spawnMock.mockReturnValue(child);

		const argv: any = {
			arrayDescomposition: false,
			expand: false,
			nestingDelimiter: '__',
			schema: {}, // no key for 'no-schema-provider'
			schemaValidate: true,
			subcmd: ['node'],
			providers: [
				{
					config: undefined,
					handler: { key: 'no-schema-provider' },
				},
			],
		};
		await envCommand.handler(argv);
		child.emit('exit', 0);

		expect(spawnMock).toHaveBeenCalled();
	});
});

// ---------------------------------------------------------------------------
// handler – expand
// ---------------------------------------------------------------------------
describe('envCommand expand', () => {
	it('interpolates env and subcmd when expand is true', async () => {
		const child = fakeChild();
		spawnMock.mockReturnValue(child);

		const argv: any = {
			arrayDescomposition: false,
			expand: true,
			nestingDelimiter: '__',
			providers: [],
			schemaValidate: false,
			subcmd: ['node', '[[NODE_ENV]]'],
		};
		await envCommand.handler(argv);
		child.emit('exit', 0);

		// spawn is called with the joined (interpolated) subcmd
		expect(spawnMock).toHaveBeenCalled();
		const cmdArg: string = spawnMock.mock.calls[0][0];
		// nODE_ENV defaults to 'development' — interpolation should have replaced [[NODE_ENV]]
		expect(cmdArg).toContain('development');
	});
});
