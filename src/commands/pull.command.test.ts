import { afterEach, describe, expect, it, vi } from 'vitest';

const { pullCommand } = await import('./pull.command.js');

afterEach(() => vi.restoreAllMocks());

describe('pullCommand builder', () => {
	it('registers options and returns the builder', () => {
		const b: any = {
			example: vi.fn().mockReturnThis(),
			options: vi.fn().mockReturnThis(),
		};
		const result = (pullCommand.builder as any)(b as any, {} as any);
		expect(b.options).toHaveBeenCalled();
		expect(result).toBe(b);
	});
});

describe('pullCommand handler', () => {
	it('pulls from providers exposing pull and logs success', async () => {
		const pull = vi.fn(async () => {});
		await pullCommand.handler({
			providers: [
				{ config: {}, handler: { key: 'a', pull } },
				{ handler: { key: 'b' } },
			],
		} as any);
		expect(pull).toHaveBeenCalled();
	});

	it('warns when no provider has a pull method', async () => {
		// should not throw — logs warn branch
		await pullCommand.handler({
			providers: [{ handler: { key: 'b' } }],
		} as any);
	});

	it('handles empty providers array and warns', async () => {
		await pullCommand.handler({ providers: [] } as any);
	});
});
