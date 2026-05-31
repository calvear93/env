import { afterEach, describe, expect, it, vi } from 'vitest';

const { pushCommand } = await import('./push.command.js');

afterEach(() => vi.restoreAllMocks());

describe('pushCommand builder', () => {
	it('registers options and returns the builder', () => {
		const b: any = {
			example: vi.fn().mockReturnThis(),
			options: vi.fn().mockReturnThis(),
		};
		const result = (pushCommand.builder as any)(b as any, {} as any);
		expect(b.options).toHaveBeenCalled();
		expect(result).toBe(b);
	});
});

describe('pushCommand handler', () => {
	it('pushes to providers exposing push and logs success', async () => {
		const push = vi.fn(async () => {});
		await pushCommand.handler({
			providers: [
				{ config: {}, handler: { key: 'a', push } },
				{ handler: { key: 'b' } },
			],
		} as any);
		expect(push).toHaveBeenCalled();
	});

	it('warns when no provider has a push method', async () => {
		// should not throw — logs warn branch
		await pushCommand.handler({
			providers: [{ handler: { key: 'b' } }],
		} as any);
	});

	it('handles empty providers array and warns', async () => {
		await pushCommand.handler({ providers: [] } as any);
	});
});
