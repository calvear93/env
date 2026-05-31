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
	maskPlaceholder: '***',
	prettyLogTemplate: '{{hh}}:{{MM}}:{{ss}}.{{ms}}\t{{logLevelName}}\t',
	prettyLogTimeZone: 'local',
	type: 'pretty',
};

/**
 * Builds a configured tslog logger. Extracted as a factory so settings logic
 * is unit-testable and reused by sub-loggers.
 */
export function createLogger(settings: LoggerSettings = {}): Logger<unknown> {
	return new Logger({
		...BASE_SETTINGS,
		maskValuesOfKeys: settings.maskValuesOfKeys ?? [],
		minLevel: LOG_LEVELS[settings.minLevel ?? 'info'],
		maskValuesRegEx: (settings.maskAnyRegEx ?? []).map(
			(pattern) => new RegExp(pattern),
		),
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
		logger.settings.maskValuesRegEx = settings.maskAnyRegEx.map(
			(pattern) => new RegExp(pattern),
		);
}

/** Global stdout logger. */
export const logger = createLogger();
