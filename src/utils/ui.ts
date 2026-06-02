import pc from 'picocolors';
import { LOG_LEVELS, logger } from './logger.js';

// emoji per known integrated provider key
const PROVIDER_ICONS: Record<string, string> = {
	'app-settings': '🗂️',
	local: '📂',
	'package-json': '📦',
	secrets: '🔐',
};

// escape introducer (ANSI), kept as a constant so the source stays ASCII-clean
const ESC = String.fromCodePoint(27);

/** Whether output is visible at the given verbosity (lower = more verbose). */
function visibleAt(level: number): boolean {
	return (logger.settings.minLevel ?? LOG_LEVELS.info) <= level;
}

function line(text = '', level = LOG_LEVELS.info): void {
	if (visibleAt(level)) process.stdout.write(`${text}\n`);
}

interface KeyMaskers {
	// lowercased exact key names
	exact: Set<string>;
	// regexes matched against the key name (no global flag, used with .test)
	patterns: RegExp[];
}

/**
 * Splits `maskValuesOfKeys` entries into exact key names and key-name regexes.
 * An entry written as `/source/flags` becomes a regex matched against the key;
 * anything else is an exact (case-insensitive) key name. The global flag is
 * intentionally NOT forced here: a global regex is stateful under `.test()`
 * (its `lastIndex` advances), unlike the value masking which needs `g` for
 * `replace`.
 */
function buildKeyMaskers(keys: readonly string[]): KeyMaskers {
	const exact = new Set<string>();
	const patterns: RegExp[] = [];

	for (const entry of keys) {
		const delimited = /^\/(.*)\/([a-z]*)$/s.exec(entry);

		if (delimited) patterns.push(new RegExp(delimited[1], delimited[2]));
		else exact.add(entry.toLowerCase());
	}

	return { exact, patterns };
}

/**
 * Masks a value the same way the logger does, reusing its mask settings, so the
 * pretty variables view never leaks secrets.
 */
function maskValue(
	key: string,
	value: string,
	keyMaskers: KeyMaskers,
): { masked: boolean; value: string } {
	const { maskPlaceholder = '***', maskValuesRegEx = [] } = logger.settings;

	if (
		keyMaskers.exact.has(key.toLowerCase()) ||
		keyMaskers.patterns.some((rx) => rx.test(key))
	)
		return { masked: true, value: maskPlaceholder };

	let masked = false;
	let out = value;

	for (const regex of maskValuesRegEx) {
		// preserve the regex's own flags (e.g. `i`) and force global so every
		// occurrence is masked, mirroring how the logger compiles its patterns
		const flags = regex.flags.includes('g')
			? regex.flags
			: `${regex.flags}g`;
		const next = out.replace(
			new RegExp(regex.source, flags),
			maskPlaceholder,
		);

		if (next !== out) masked = true;
		out = next;
	}

	return { masked, value: out };
}

/** 256-color orange, gated by picocolors' own color-support detection. */
function orange(text: string): string {
	return pc.isColorSupported ? `${ESC}[38;5;208m${text}${ESC}[39m` : text;
}

/** Colors a scalar value by its runtime type so types are visually distinct. */
function colorScalar(value: unknown, text: string): string {
	switch (typeof value) {
		case 'bigint':
		case 'number':
			return orange(text);
		case 'boolean':
			return value ? pc.green(text) : pc.red(text);
		case 'string':
			return pc.gray(text);
		default:
			return pc.dim(text);
	}
}

/** Formats a duration in ms as "142ms" or "1.4s". */
export function formatDuration(ms: number): string {
	return ms < 1000 ? `${Math.round(ms)}ms` : `${(ms / 1000).toFixed(1)}s`;
}

export const ui = {
	header(version: string, env?: string, modes?: string[]): void {
		const parts = [pc.bold('⚡ env') + pc.dim(` v${version}`)];

		if (env) parts.push(`🌎 ${pc.bold(pc.green(env))}`);
		if (modes && modes.length > 0)
			parts.push(`🧩 ${pc.magenta(modes.join('+'))}`);

		line();
		line(parts.join(pc.dim('  ·  ')));
		line();
	},

	provider(key: string, count: number): void {
		const icon = PROVIDER_ICONS[key] ?? '🧩';
		const noun = key === 'secrets' ? 'secrets' : 'vars';

		line(
			`  ${icon}  ${pc.cyan(key.padEnd(16))} ${pc.bold(String(count))} ${pc.dim(noun)}`,
		);
	},

	/** Pretty, sorted, masked dump of the resolved environment (debug level). */
	variables(env: Record<string, unknown>): void {
		if (!visibleAt(LOG_LEVELS.debug)) return;

		const entries = Object.entries(env).sort(([a], [b]) =>
			a.localeCompare(b),
		);
		const width = entries.reduce(
			(max, [key]) => Math.max(max, key.length),
			0,
		);
		const heading = pc.dim(`environment (${entries.length} variables)`);
		// compile key maskers once, not per variable
		const keyMaskers = buildKeyMaskers(
			logger.settings.maskValuesOfKeys ?? [],
		);

		line(`  ${heading}`, LOG_LEVELS.debug);

		for (const [key, value] of entries) {
			const { masked, value: shown } = maskValue(
				key,
				String(value),
				keyMaskers,
			);
			const colored = masked
				? pc.yellow(shown)
				: colorScalar(value, shown);

			line(
				`    ${pc.cyan(key.padEnd(width))} ${pc.dim('=')} ${colored}`,
				LOG_LEVELS.debug,
			);
		}

		line('', LOG_LEVELS.debug);
	},

	summary(total: number, ms: number): void {
		const duration = pc.dim(`in ${formatDuration(ms)}`);
		line();
		line(
			`  ${pc.green('✓')} ${pc.bold(String(total))} variables loaded ${duration}`,
		);
	},

	running(command: string): void {
		line();
		line(`  ${pc.yellow('▶')} ${pc.bold(command)}`);
		line();
	},

	finished(ms: number): void {
		const duration = pc.dim(`finished in ${formatDuration(ms)}`);
		line(`  ${pc.green('✓')} ${duration}`);
	},

	failed(code: number): void {
		const msg = pc.red(`✗ exited with code ${code}`);
		line(`  ${msg}`);
	},

	action(emoji: string, message: string): void {
		line(`  ${emoji} ${message}`);
	},
};
