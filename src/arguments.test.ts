import { describe, expect, it } from 'vitest';
import { args } from './arguments.js';

describe('args – CLI option map', () => {
	it('env: alias=e, type=string', () => {
		expect(args.env.alias).toBe('e');
		expect(args.env.type).toBe('string');
	});

	it('modes: alias=m, type=array', () => {
		expect(args.modes.alias).toBe('m');
		expect(args.modes.type).toBe('array');
	});

	it('logLevel: default=info, correct choices', () => {
		expect(args.logLevel.default).toBe('info');
		expect(args.logLevel.choices).toEqual([
			'silly',
			'trace',
			'debug',
			'info',
			'warn',
			'error',
		]);
	});

	it('nestingDelimiter: alias=nd, default=__', () => {
		expect(args.nestingDelimiter.alias).toBe('nd');
		expect(args.nestingDelimiter.default).toBe('__');
	});

	it('resolve: alias=r, choices=[merge,override], default=merge', () => {
		expect(args.resolve.alias).toBe('r');
		expect(args.resolve.choices).toEqual(['merge', 'override']);
		expect(args.resolve.default).toBe('merge');
	});

	it('ci: type=boolean, default is a boolean', () => {
		expect(args.ci.type).toBe('boolean');
		// default is ci.isCI evaluated at import — just confirm it is a boolean
		expect(typeof args.ci.default).toBe('boolean');
	});

	it('providers: type=array, hidden=true, default is a non-empty array', () => {
		expect(args.providers.type).toBe('array');
		expect(args.providers.hidden).toBe(true);
		expect(Array.isArray(args.providers.default)).toBe(true);
		expect((args.providers.default as unknown[]).length).toBeGreaterThan(0);
	});

	it('arrayDescomposition: alias=arrDesc, default=false', () => {
		expect(args.arrayDescomposition.alias).toBe('arrDesc');
		expect(args.arrayDescomposition.default).toBe(false);
	});

	it('expand: alias=x, default=false', () => {
		expect(args.expand.alias).toBe('x');
		expect(args.expand.default).toBe(false);
	});

	it('root: type=string, default=env', () => {
		expect(args.root.type).toBe('string');
		expect(args.root.default).toBe('env');
	});

	it('configFile: alias=c, has default', () => {
		expect(args.configFile.alias).toBe('c');
		expect(typeof args.configFile.default).toBe('string');
	});

	it('schemaFile: has aliases [s, schema], type=string', () => {
		expect(args.schemaFile.alias).toEqual(['s', 'schema']);
		expect(args.schemaFile.type).toBe('string');
	});

	it('packageJson: alias=pkg, default is empty string', () => {
		expect(args.packageJson.alias).toEqual(['pkg']);
		expect(args.packageJson.default).toBe('');
	});

	it('nullable: alias=null, default=true', () => {
		expect(args.nullable.alias).toBe('null');
		expect(args.nullable.default).toBe(true);
	});

	it('detectFormat: alias=df, default=false', () => {
		expect(args.detectFormat.alias).toBe('df');
		expect(args.detectFormat.default).toBe(false);
	});

	it('logMaskAnyRegEx: alias=mrx, grouped under Logger, default=[]', () => {
		expect(args.logMaskAnyRegEx.alias).toBe('mrx');
		expect(args.logMaskAnyRegEx.group).toBe('Logger Options');
		expect(args.logMaskAnyRegEx.default).toEqual([]);
	});

	it('logMaskValuesOfKeys: alias=mvk, grouped under Logger, default=[]', () => {
		expect(args.logMaskValuesOfKeys.alias).toBe('mvk');
		expect(args.logMaskValuesOfKeys.group).toBe('Logger Options');
		expect(args.logMaskValuesOfKeys.default).toEqual([]);
	});

	it('exportIgnoreKeys: alias=iek, hidden=true, default=[]', () => {
		expect(args.exportIgnoreKeys.alias).toBe('iek');
		expect(args.exportIgnoreKeys.hidden).toBe(true);
		expect(args.exportIgnoreKeys.default).toEqual([]);
	});
});
