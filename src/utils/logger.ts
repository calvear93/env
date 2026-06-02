import { Logger } from 'tslog';
import type { ISettingsParam } from 'tslog';

export type LogLevelName =
	| 'debug'
	| 'error'
	| 'info'
	| 'silly'
	| 'trace'
	| 'warn';

/** tslog v4 numeric minLevel by level name. */
export const LOG_LEVELS: Record<LogLevelName, number> = {
	debug: 2,
	error: 5,
	info: 3,
	silly: 0,
	trace: 1,
	warn: 4,
};

export interface LoggerSettings {
	maskAnyRegEx?: string[];
	maskValuesOfKeys?: string[];
	minLevel?: LogLevelName;
}

const BASE_SETTINGS: ISettingsParam<unknown> = {
	hideLogPositionForProduction: true,
	maskPlaceholder: '*****',
	// key masking matches regardless of case, so PASSWORD/Password/password
	// are all masked and the pretty env render stays consistent with tslog
	maskValuesOfKeysCaseInsensitive: true,
	prettyLogTemplate: '{{hh}}:{{MM}}:{{ss}}.{{ms}}\t{{logLevelName}}\t',
	prettyLogTimeZone: 'local',
	type: 'pretty',
};

/**
 * Compiles a user-supplied mask pattern into a RegExp.
 *
 * Accepts either a bare source (`secret\\d+`) or the `/source/flags` form
 * (`/secret/i`) so callers can opt into case-insensitive or other flags. The
 * global flag is always forced: tslog masks via `String.replace`, which only
 * replaces the first match otherwise, so a secret repeated in one string would
 * leak its later occurrences.
 */
function compileMaskRegEx(pattern: string): RegExp {
	const delimited = /^\/(.*)\/([a-z]*)$/s.exec(pattern);
	const source = delimited ? delimited[1] : pattern;
	const flags = delimited ? delimited[2] : '';

	return new RegExp(source, flags.includes('g') ? flags : `${flags}g`);
}

/**
 * Builds a configured tslog logger. Extracted as a factory so settings logic
 * is unit-testable and reused by sub-loggers.
 */
export function createLogger(settings: LoggerSettings = {}): Logger<unknown> {
	return new Logger({
		...BASE_SETTINGS,
		maskValuesOfKeys: settings.maskValuesOfKeys ?? [],
		maskValuesRegEx: (settings.maskAnyRegEx ?? []).map(compileMaskRegEx),
		minLevel: LOG_LEVELS[settings.minLevel ?? 'info'],
	});
}

/**
 * Applies runtime settings to an existing logger by mutating `logger.settings`
 * (tslog v4 has no `setSettings`).
 */
export function configureLogger(
	logger: Logger<unknown>,
	settings: LoggerSettings,
): void {
	if (settings.minLevel)
		logger.settings.minLevel = LOG_LEVELS[settings.minLevel];

	if (settings.maskValuesOfKeys)
		logger.settings.maskValuesOfKeys = settings.maskValuesOfKeys;

	if (settings.maskAnyRegEx)
		logger.settings.maskValuesRegEx =
			settings.maskAnyRegEx.map(compileMaskRegEx);
}

/** Global stdout logger. */
export const logger = createLogger();
