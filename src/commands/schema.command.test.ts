import { afterEach, describe, expect, it, vi } from 'vitest';

const loadVariablesFromProviders = vi.fn(() => Promise.resolve([]));
const generateSchemaFrom = vi.fn(() => Promise.resolve({}));

vi.mock('../utils/index.js', async () => {
	const actual = await vi.importActual<any>('../utils/index.js');
	return { ...actual, generateSchemaFrom, loadVariablesFromProviders };
});

const { schemaCommand } = await import('./schema.command.js');

afterEach(() => vi.clearAllMocks());

describe('schemaCommand builder', () => {
	it('registers an example and returns the builder', () => {
		const b: any = {
			example: vi.fn().mockReturnThis(),
		};
		const result = (schemaCommand.builder as any)(b as any, {} as any);
		expect(b.example).toHaveBeenCalled();
		expect(result).toBe(b);
	});
});

describe('schemaCommand handler', () => {
	it('forces ci=true and calls generateSchemaFrom', async () => {
		const argv: any = { providers: [] };
		await schemaCommand.handler(argv);
		expect(argv.ci).toBe(true);
		expect(loadVariablesFromProviders).toHaveBeenCalledWith([], argv);
		expect(generateSchemaFrom).toHaveBeenCalled();
	});

	it('passes results and argv to generateSchemaFrom', async () => {
		const fakeResults = [{ key: 'x', value: { A: 1 } }];
		loadVariablesFromProviders.mockResolvedValueOnce(fakeResults as any);
		const argv: any = { providers: [], schemaFile: 'schema.json' };
		await schemaCommand.handler(argv);
		expect(generateSchemaFrom).toHaveBeenCalledWith(fakeResults, argv);
	});
});
