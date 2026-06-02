# Change Log

All notable changes to this project will be documented in this file.

## [3.1.0] - 2026-06-02

### Added

-   pretty environment render colorized by type at `--log debug` — strings in gray, numbers in orange, booleans `true`/`false` in green/red — sorted and masked; the `export` command shares the same render
-   mask secrets by key regex: `logMaskValuesOfKeys` (`--mvk`) entries may now be a `/source/flags` regex matched against the key name (e.g. `/token/i`), in addition to exact key names
-   `logMaskAnyRegEx` (`--mrx`) supports the `/source/flags` form and always forces the global flag, so **every** occurrence inside a value is masked
-   case-insensitive key masking for `logMaskValuesOfKeys`

### Fixed

-   nested `$` global marker leaked into the variable name: `GROUP.$VAR1` was injected as `GROUP__$VAR1`. `flatten` now strips the marker per segment → `GROUP__VAR1` (the marker is still preserved in the secrets file storage)
-   `flatSchema` strips the `$` marker as well, so schema-validation keys match the injected (stripped) environment keys and global keys are validated correctly

## [3.0.0] - 2026-05-31

### Breaking

-   migrated to pure ESM (`"type": "module"`); package now ships ESM only
-   minimum runtime is now NodeJS `>=20` (pnpm `>=9`)
-   custom providers must be authored as ESM modules (`export default`)

### Changed

-   build migrated from `tsc` to Vite (library mode) + `vite-plugin-dts`
-   tests migrated from Jest to Vitest (unit suite at 100% coverage + integration project)
-   ESLint migrated to flat config (`eslint.config.js`) + typescript-eslint
-   dependency upgrades: tslog 3 → 4, yargs 17 → 18, ajv 8.x, TypeScript 6
-   replaced `chalk` with `picocolors`
-   logger rewritten for tslog v4 (`createLogger`/`configureLogger` factory)
-   new pretty CLI output (`ui` module): banner, per-provider counts, masked
    environment dump and run summary
-   extracted the argv quote-composition parser into `utils/argv.util.ts`

### Fixed

-   child process exit code is now propagated for any non-zero status (not only `1`)
-   `normalize` strips the leading shared-prefix `$` explicitly (mid-key `$` preserved)
-   accurate `flatten`/`normalize` return types and JSDoc; removed dead code

## [2.6.0] - 2022-10-31

-   package.json pah param

## [2.3.0] - 2022-10-30

-   updates

## [2.3.0] - 2022-10-21

-   migrated to PNPM
-   ci recognition

## [2.2.1] - 2022-09-21

-   validation for no env or mode

## [2.2.0] - 2022-09-21

-   env not required
-   messages tweaks
-   provider that require env are skipped if not present

## [2.1.1] - 2022-09-15

-   packages updated

## [2.1.0] - 2022-07-09

-   packages updated

## [2.0.1] - 2022-05-15

-   docs and minor tweaks

## [2.0.0] - 2022-05-15

-   reworked file paths
-   separated local var provider from secrets provider

## [1.2.3] - 2022-05-14

-   loader interface tweaks

## [1.2.2] - 2022-04-22

-   fix local secrets was loading on schema generation

## [1.2.2] - 2022-04-20

-   fix nesting delimiter in flatSchema

## [1.2.1] - 2022-04-17

-   secrets provider fix

## [1.2.0] - 2022-04-15

-   expand options for interpolate env vars

## [1.1.0] - 2022-04-13

-   schema validation refactor

## [1.0.1] - 2022-04-05

-   No config file message log level changed from warning to silly

## [1.0.0] - 2022-04-05

-   Load environment variables and executes a subcommand or script.
-   Custom and integrated providers for load, piush and pull variables.
-   Pulls variables from providers.
-   Pushes variables to providers.
-   Creates a JSON Schema from variables for validation.
