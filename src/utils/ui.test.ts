import pc from 'picocolors';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LOG_LEVELS, logger } from './logger.js';
import { formatDuration, ui } from './ui.js';

// ---------------------------------------------------------------------------
// Spy on process.stdout.write so tests don't pollute output
// ---------------------------------------------------------------------------
let writeSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
	writeSpy = vi
		.spyOn(process.stdout, 'write')
		.mockReturnValue(true as unknown as boolean);
	// restore to info level (default) before each test
	logger.settings.minLevel = LOG_LEVELS.info;
});

afterEach(() => {
	vi.restoreAllMocks();
	// reset to default after each test
	logger.settings.minLevel = LOG_LEVELS.info;
});

/** Collect all writes from stdout spy as a single string. */
function capturedOutput(): string {
	return writeSpy.mock.calls
		.map((args: unknown[]) => String(args[0]))
		.join('');
}

// ---------------------------------------------------------------------------
// formatDuration
// ---------------------------------------------------------------------------
describe('formatDuration', () => {
	it('returns Nms for values under 1000', () => {
		expect(formatDuration(142)).toBe('142ms');
		expect(formatDuration(0)).toBe('0ms');
		expect(formatDuration(999)).toBe('999ms');
	});

	it('returns N.Ns for values >= 1000', () => {
		expect(formatDuration(1000)).toBe('1.0s');
		expect(formatDuration(1400)).toBe('1.4s');
		expect(formatDuration(5500)).toBe('5.5s');
	});
});

// ---------------------------------------------------------------------------
// enabled() gating — suppressed at error level
// ---------------------------------------------------------------------------
describe('ui – suppressed when logger level > info', () => {
	beforeEach(() => {
		// set to error (5) which is higher than info (3) → ui should be silent
		logger.settings.minLevel = LOG_LEVELS.error;
	});

	it('does not write to stdout when level is error', () => {
		ui.header('1.0.0', 'dev', ['debug']);
		ui.provider('local', 5);
		ui.summary(10, 200);
		ui.running('node app.js');
		ui.finished(500);
		ui.failed(1);
		ui.action('🎉', 'done');
		expect(writeSpy).not.toHaveBeenCalled();
	});
});

// ---------------------------------------------------------------------------
// enabled() gating — null-coalescing branch (minLevel undefined → defaults to info)
// ---------------------------------------------------------------------------
describe('ui – null-coalescing fallback when minLevel is undefined', () => {
	it('falls back to info level and prints when minLevel is undefined', () => {
		// store the original and set to undefined to exercise the ?? branch
		const original = logger.settings.minLevel;
		(logger.settings as any).minLevel = undefined;

		ui.action('🔧', 'test message');
		expect(writeSpy).toHaveBeenCalled();

		// restore
		logger.settings.minLevel = original;
	});
});

// ---------------------------------------------------------------------------
// ui.header
// ---------------------------------------------------------------------------
describe('ui.header', () => {
	it('prints version without env or modes', () => {
		ui.header('1.2.3');
		const out = capturedOutput();
		expect(out).toContain('env');
		expect(out).toContain('v1.2.3');
	});

	it('prints env when provided', () => {
		ui.header('1.0.0', 'dev');
		expect(capturedOutput()).toContain('dev');
	});

	it('prints modes when provided', () => {
		ui.header('1.0.0', 'dev', ['debug', 'test']);
		expect(capturedOutput()).toContain('debug+test');
	});

	it('prints without modes when modes is empty array', () => {
		ui.header('1.0.0', 'staging', []);
		const out = capturedOutput();
		expect(out).toContain('staging');
		// no modes indicator expected for empty modes
		expect(out).not.toContain('🧩');
	});

	it('prints header with neither env nor modes', () => {
		ui.header('2.0.0');
		// should still call write (empty lines + version line)
		expect(writeSpy).toHaveBeenCalled();
	});
});

// ---------------------------------------------------------------------------
// ui.provider
// ---------------------------------------------------------------------------
describe('ui.provider', () => {
	it('uses 📦 icon and "vars" noun for package-json', () => {
		ui.provider('package-json', 3);
		const out = capturedOutput();
		expect(out).toContain('📦');
		expect(out).toContain('package-json');
		expect(out).toContain('3');
		expect(out).toContain('vars');
	});

	it('uses 🔐 icon and "secrets" noun for secrets', () => {
		ui.provider('secrets', 12);
		const out = capturedOutput();
		expect(out).toContain('🔐');
		expect(out).toContain('secrets');
		expect(out).toContain('12');
	});

	it('uses 📂 icon and "vars" noun for local', () => {
		ui.provider('local', 7);
		const out = capturedOutput();
		expect(out).toContain('📂');
		expect(out).toContain('local');
		expect(out).toContain('7');
		expect(out).toContain('vars');
	});

	it('uses 🗂️ icon and "vars" noun for app-settings', () => {
		ui.provider('app-settings', 4);
		const out = capturedOutput();
		expect(out).toContain('🗂️');
		expect(out).toContain('app-settings');
		expect(out).toContain('4');
		expect(out).toContain('vars');
	});

	it('uses 🧩 fallback icon for unknown providers', () => {
		ui.provider('my-custom-provider', 1);
		const out = capturedOutput();
		expect(out).toContain('🧩');
		expect(out).toContain('my-custom-provider');
		expect(out).toContain('vars');
	});
});

// ---------------------------------------------------------------------------
// ui.summary
// ---------------------------------------------------------------------------
describe('ui.summary', () => {
	it('prints total count and formatted duration', () => {
		ui.summary(42, 350);
		const out = capturedOutput();
		expect(out).toContain('42');
		expect(out).toContain('350ms');
		expect(out).toContain('variables loaded');
	});

	it('uses second format for large durations', () => {
		ui.summary(10, 2500);
		expect(capturedOutput()).toContain('2.5s');
	});
});

// ---------------------------------------------------------------------------
// ui.running
// ---------------------------------------------------------------------------
describe('ui.running', () => {
	it('prints the command string', () => {
		ui.running('node app.js --flag');
		const out = capturedOutput();
		expect(out).toContain('node app.js --flag');
		expect(out).toContain('▶');
	});
});

// ---------------------------------------------------------------------------
// ui.finished
// ---------------------------------------------------------------------------
describe('ui.finished', () => {
	it('prints finished with duration', () => {
		ui.finished(750);
		const out = capturedOutput();
		expect(out).toContain('finished in');
		expect(out).toContain('750ms');
		expect(out).toContain('✓');
	});
});

// ---------------------------------------------------------------------------
// ui.failed
// ---------------------------------------------------------------------------
describe('ui.failed', () => {
	it('prints failure with exit code', () => {
		ui.failed(2);
		const out = capturedOutput();
		expect(out).toContain('✗');
		expect(out).toContain('2');
		expect(out).toContain('exited with code');
	});
});

// ---------------------------------------------------------------------------
// ui.action
// ---------------------------------------------------------------------------
describe('ui.action', () => {
	it('prints emoji and message', () => {
		ui.action('🎉', 'all done here');
		const out = capturedOutput();
		expect(out).toContain('🎉');
		expect(out).toContain('all done here');
	});
});

// ---------------------------------------------------------------------------
// ui.variables
// ---------------------------------------------------------------------------
describe('ui.variables', () => {
	afterEach(() => {
		logger.settings.maskValuesOfKeys = [];
		logger.settings.maskValuesRegEx = [];
	});

	it('is silent at info level (only renders at debug)', () => {
		logger.settings.minLevel = LOG_LEVELS.info;
		ui.variables({ FOO: 'bar' });
		expect(writeSpy).not.toHaveBeenCalled();
	});

	it('renders sorted keys with a count at debug level', () => {
		logger.settings.minLevel = LOG_LEVELS.debug;
		ui.variables({ ALPHA: '2', MIDDLE: '3', ZEBRA: '1' });
		const out = capturedOutput();
		expect(out).toContain('environment (3 variables)');
		expect(out.indexOf('ALPHA')).toBeLessThan(out.indexOf('MIDDLE'));
		expect(out.indexOf('MIDDLE')).toBeLessThan(out.indexOf('ZEBRA'));
	});

	it('masks values of configured keys (case-insensitive)', () => {
		logger.settings.minLevel = LOG_LEVELS.debug;
		logger.settings.maskValuesOfKeys = ['secret'];
		ui.variables({ PUBLIC: 'visible', SECRET: 'do-not-show' });
		const out = capturedOutput();
		expect(out).toContain('***');
		expect(out).not.toContain('do-not-show');
		expect(out).toContain('visible');
	});

	it('masks keys matching a /regex/ entry (substring, case-insensitive)', () => {
		logger.settings.minLevel = LOG_LEVELS.debug;
		logger.settings.maskValuesOfKeys = ['/token/i'];
		ui.variables({
			ACCESS_TOKEN: 'aaa',
			HOST: 'localhost',
			Refresh_Token: 'bbb',
		});
		const out = capturedOutput();
		expect(out).not.toContain('aaa');
		expect(out).not.toContain('bbb');
		expect(out).toContain('localhost');
	});

	it('respects flags: /token/ without i does not mask uppercase keys', () => {
		logger.settings.minLevel = LOG_LEVELS.debug;
		logger.settings.maskValuesOfKeys = ['/token/'];
		ui.variables({ TOKEN: 'shown' });
		const out = capturedOutput();
		expect(out).toContain('shown');
	});

	it('supports mixing exact keys and /regex/ entries', () => {
		logger.settings.minLevel = LOG_LEVELS.debug;
		logger.settings.maskValuesOfKeys = ['PASSWORD', '/key/i'];
		ui.variables({
			API_KEY: 'kkk',
			HOST: 'localhost',
			PASSWORD: 'ppp',
		});
		const out = capturedOutput();
		expect(out).not.toContain('kkk');
		expect(out).not.toContain('ppp');
		expect(out).toContain('localhost');
	});

	it('masks every occurrence matching a mask regex', () => {
		logger.settings.minLevel = LOG_LEVELS.debug;
		logger.settings.maskValuesRegEx = [/token/];
		ui.variables({ A: 'token token', B: 'clean' });
		const out = capturedOutput();
		expect(out).not.toContain('token');
		expect(out).toContain('clean');
	});

	it('preserves regex flags such as case-insensitivity', () => {
		logger.settings.minLevel = LOG_LEVELS.debug;
		logger.settings.maskValuesRegEx = [/secret/i];
		ui.variables({ A: 'SECRET-value', B: 'Secret' });
		const out = capturedOutput();
		expect(out).not.toContain('SECRET');
		expect(out).not.toContain('Secret');
		expect(out).toContain('***');
	});

	it('reuses an already-global mask regex as-is', () => {
		logger.settings.minLevel = LOG_LEVELS.debug;
		logger.settings.maskValuesRegEx = [/tok/g];
		ui.variables({ A: 'tok tok tok' });
		const out = capturedOutput();
		expect(out).not.toContain('tok');
		expect(out).toContain('***');
	});

	it('handles undefined maskValuesOfKeys', () => {
		logger.settings.minLevel = LOG_LEVELS.debug;
		(logger.settings as any).maskValuesOfKeys = undefined;
		ui.variables({ FOO: 'bar' });
		expect(capturedOutput()).toContain('bar');
	});

	it('handles an empty environment', () => {
		logger.settings.minLevel = LOG_LEVELS.debug;
		ui.variables({});
		expect(capturedOutput()).toContain('environment (0 variables)');
	});

	it('colors values distinctly by runtime type', () => {
		logger.settings.minLevel = LOG_LEVELS.debug;
		// numbers/bigints render in 256-color orange (gated by color support)
		const esc = String.fromCodePoint(27);
		const orange = (t: string) =>
			pc.isColorSupported ? `${esc}[38;5;208m${t}${esc}[39m` : t;
		ui.variables({ BIG: 10n, NO: false, NUM: 42, STR: 'hello', YES: true });
		const out = capturedOutput();
		// pc.* is identity when colors are disabled, so this holds either way
		expect(out).toContain(orange('42'));
		expect(out).toContain(orange('10'));
		expect(out).toContain(pc.green('true'));
		expect(out).toContain(pc.red('false'));
		expect(out).toContain(pc.gray('hello'));
	});

	it('renders numbers as plain text when colors are unsupported', () => {
		logger.settings.minLevel = LOG_LEVELS.debug;
		const original = pc.isColorSupported;
		(pc as any).isColorSupported = false;
		try {
			ui.variables({ NUM: 7 });
			const out = capturedOutput();
			expect(out).toContain('7');
			// no 256-color orange escape when color is unsupported
			expect(out).not.toContain('38;5;208');
		} finally {
			(pc as any).isColorSupported = original;
		}
	});

	it('renders non-scalar values dimmed', () => {
		logger.settings.minLevel = LOG_LEVELS.debug;
		ui.variables({ NOTHING: null });
		expect(capturedOutput()).toContain(pc.dim('null'));
	});
});
