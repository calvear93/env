import pc from 'picocolors';
import { LOG_LEVELS, logger } from './logger.js';

// emoji per known integrated provider key
const PROVIDER_ICONS: Record<string, string> = {
	'app-settings': '🗂️',
	local: '📂',
	'package-json': '📦',
	secrets: '🔐',
};

/** Whether output is visible at the given verbosity (lower = more verbose). */
function visibleAt(level: number): boolean {
	return (logger.settings.minLevel ?? LOG_LEVELS.info) <= level;
}

function line(text = '', level = LOG_LEVELS.info): void {
	if (visibleAt(level)) process.stdout.write(`${text}\n`);
}

/**
 * Masks a value the same way the logger does, reusing its mask settings, so the
 * pretty variables view never leaks secrets.
 */
function maskValue(
	key: string,
	value: string,
): { masked: boolean; value: string } {
	const {
		maskPlaceholder = '***',
		maskValuesOfKeys = [],
		maskValuesRegEx = [],
	} = logger.settings;

	if (maskValuesOfKeys.some((k) => k.toLowerCase() === key.toLowerCase()))
		return { masked: true, value: maskPlaceholder };

	let masked = false;
	let out = value;

	for (const regex of maskValuesRegEx) {
		const next = out.replaceAll(
			new RegExp(regex.source, 'g'),
			maskPlaceholder,
		);

		if (next !== out) masked = true;
		out = next;
	}

	return { masked, value: out };
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

		line(`  ${heading}`, LOG_LEVELS.debug);

		for (const [key, value] of entries) {
			const { masked, value: shown } = maskValue(key, String(value));
			const colored = masked ? pc.yellow(shown) : pc.green(shown);

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
