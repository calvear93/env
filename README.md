<div id="top" align="center">
  <img alt="@calvear/env logo" src="assets/logo.svg" width="150" />

  <h1 align="center"><b>env</b></h1>
  <h4 align="center">Environment variables made easy — load, validate, inject.</h4>

  <p align="center">
    <img src="https://img.shields.io/npm/v/@calvear/env?style=flat-square&color=2563eb&label=version" alt="version" />
    &nbsp;
    <img src="https://img.shields.io/badge/module-ESM-f59e0b?style=flat-square" alt="esm" />
    &nbsp;
    <img src="https://img.shields.io/badge/TypeScript-007ACC?style=flat-square&logo=typescript&logoColor=white" alt="typescript" />
    &nbsp;
    <img src="https://img.shields.io/badge/node->=20-339933?style=flat-square&logo=node.js&logoColor=white" alt="node engine" />
    &nbsp;
    <img src="https://img.shields.io/badge/coverage-100%25-22c55e?style=flat-square" alt="coverage" />
    &nbsp;
    <img src="https://img.shields.io/npm/l/@calvear/env?style=flat-square&color=eab308" alt="license" />
  </p>
</div>

<br />

<!-- ABOUT -->

## 📖 About

`@calvear/env` eases **environment variable handling** for NodeJS apps — like
[env-cmd](https://www.npmjs.com/package/env-cmd) or
[dotenv](https://www.npmjs.com/package/dotenv), but with **powerful, extensible
features**: pluggable **providers** to `load`, `pull` and `push` variables from
different stores, **JSON Schema validation**, value **interpolation**, secret
**masking** and nested/shared keys.

### ✨ Features

- 🧩 **Provider plugins** — bundled `package-json`, `app-settings`, `secrets`
  and `local` providers, plus your own (NPM package or local script).
- 💉 **Injection** — load variables into `process.env` and run any command.
- ✅ **JSON Schema** — auto-generate and validate variables before injecting.
- 🪆 **Nested & global keys** — `GROUP__VAR` flattening and `$`-prefixed global
  keys (the `$` marker is stripped on injection).
- 🧵 **Interpolation** — reference other args/vars with `[[ ]]` delimiters.
- 🙈 **Masking** — hide secrets in the debug output by key name, key regex, or
  value content regex.
- 🎨 **Pretty output** — colorized, sorted, masked debug render of the resolved
  environment.
- 📤 **Export** — write the unified environment to a `.env` or JSON file.

<p align="right">(<a href="#top">back to top</a>)</p>

<!-- REQUIREMENTS -->

## 📌 Requirements

[NodeJS](https://nodejs.org/) **20 or higher**.

```bash
> node -v
v20.0.0
```

<p align="right">(<a href="#top">back to top</a>)</p>

<!-- ESM -->

## 📦 ESM only

Since **v3** this package is **ESM-only** (`"type": "module"`). Consumers must
use ESM `import` syntax, and custom providers must be ESM modules that `export`
their provider object.

```javascript
// ✅ ESM
import { EnvProvider } from '@calvear/env';

// ❌ CommonJS require is not supported
// const { EnvProvider } = require('@calvear/env');
```

<p align="right">(<a href="#top">back to top</a>)</p>

<!-- QUICK START -->

## ⚡️ Quick start

Install the package:

```bash
> npm install @calvear/env
```

Run the binary directly:

```bash
> npx env --help

  Usage: env [command] [options..] [: subcmd [:]] [options..]

  Commands:
    env [options..] [: <subcmd> :]
    env pull [options..]
    env push [options..]
    env schema [options..]
    env export [options..]
```

Or wire it into your **npm scripts**:

```jsonc
{
	"scripts": {
		// inject "dev" variables (debug mode) and start the app
		"start:dev": "env -e dev -m debug : node dist/main.js",
		// inject "prod" variables for the build
		"build:prod": "env -e prod -m build : tsc",
		// regenerate the validation schema
		"env:schema": "env schema -e dev",
	},
}
```

Run it:

```bash
> npm run start:dev

  ⚡ env v3.0.0  ·  🌎 dev  ·  🧩 debug

    📦  package-json     6 vars
    🗂️  app-settings     5 vars
    🔐  secrets          1 secrets
    📂  local            1 vars

    environment (12 variables)
      ENV        = dev
      NODE_ENV   = development
      SECRET     = *****
      VERSION    = 3.0.0
      ...

    ✓ 12 variables loaded in 142ms

    ▶ node dist/main.js
  My environment loaded is: dev
    ✓ finished in 168ms
```

> The resolved environment is only rendered at `--log debug`. Values are
> **sorted**, **secrets are masked**, and colored by type — strings in gray,
> numbers in orange, booleans `true`/`false` in green/red.

<p align="right">(<a href="#top">back to top</a>)</p>

<!-- COMMANDS AND OPTIONS -->

## ⚙️ Commands & Options

> **Interpolation** — any option value can reference other arguments using `[[`
> and `]]` delimiters. With `root: "config"`, the value `[[root]]/file.json`
> resolves to `config/file.json`; with `env: "dev"`,
> `[[root]]/config.[[env]].json` resolves to `config/config.dev.json`.

### Global options

| Option                             | Description                                       | Type       | Default |
| ---------------------------------- | ------------------------------------------------- | ---------- | ------- |
| `--help`                           | Show help                                         | `boolean`  |         |
| `-e, --env`                        | Environment to load (i.e. `dev`, `prod`)          | `string`   |         |
| `-m, --modes`                      | Execution modes (i.e. `debug`, `test`)            | `string[]` | `[]`    |
| `--nd, --nestingDelimiter`         | Nesting-level delimiter for flatten               | `string`   | `__`    |
| `--arrDesc, --arrayDescomposition` | Serialize (`false`) or break down (`true`) arrays | `boolean`  | `false` |
| `-x, --expand`                     | Interpolate environment variables using itself    | `boolean`  | `false` |
| `--ci`                             | Continuous Integration mode (skips local files)   | `boolean`  | auto    |

### Workspace options

| Option                 | Description                       | Type     | Default                           |
| ---------------------- | --------------------------------- | -------- | --------------------------------- |
| `--root`               | Base environment folder path      | `string` | `env`                             |
| `-c, --configFile`     | Config JSON file path             | `string` | `[[root]]/settings/settings.json` |
| `-s, --schemaFile`     | Environment schema JSON file path | `string` | `[[root]]/settings/schema.json`   |
| `--pkg, --packageJson` | `package.json` path               | `string` | _cwd_                             |

### JSON Schema options

| Option                 | Description                                    | Type               | Default |
| ---------------------- | ---------------------------------------------- | ------------------ | ------- |
| `-r, --resolve`        | Merge new schema or override it                | `merge`/`override` | `merge` |
| `--null, --nullable`   | Whether variables are nullable by default      | `boolean`          | `true`  |
| `--df, --detectFormat` | Include string formats in the generated schema | `boolean`          | `false` |

### Logger options

| Option                         | Description                                            | Type                                          | Default |
| ------------------------------ | ------------------------------------------------------ | --------------------------------------------- | ------- |
| `--log, --logLevel`            | Log level                                              | `silly`/`trace`/`debug`/`info`/`warn`/`error` | `info`  |
| `--mvk, --logMaskValuesOfKeys` | Mask a value when its **key** matches (exact or regex) | `string[]`                                    | `[]`    |
| `--mrx, --logMaskAnyRegEx`     | Mask **value content** matching a regex (every match)  | `string[]`                                    | `[]`    |

See [🙈 Masking secrets](#-masking-secrets) for the full masking semantics.

---

### `env`

Inject environment variables into `process.env` and execute a command (the
command goes after `:`).

```bash
env -e <env> [options..] [: <subcmd> :] [options..]
```

```bash
> env -e dev -m test unit : npm test
> env -e dev -m debug : npm start : -c [[root]]/[[env]].env.json
> env -e prod -m build optimize : npm run build
```

| Option                         | Description                                | Type      | Default |
| ------------------------------ | ------------------------------------------ | --------- | ------- |
| `--validate, --schemaValidate` | Validate variables against the JSON schema | `boolean` | `true`  |

### `pull`

Pull environment variables from the providers' stores (for providers that
implement `pull`, i.e. custom remote providers).

```bash
env pull -e <env> [options..]
```

| Option            | Description               | Type      | Default |
| ----------------- | ------------------------- | --------- | ------- |
| `-o, --overwrite` | Overwrite local variables | `boolean` | `false` |

### `push`

Push environment variables to the providers' stores (for providers that
implement `push`).

```bash
env push -e <env> [options..]
```

| Option        | Description            | Type      | Default |
| ------------- | ---------------------- | --------- | ------- |
| `-f, --force` | Force push for secrets | `boolean` | `false` |

### `schema`

Generate (or update) the validation schema from the providers' output.

```bash
> env schema -e dev -m build
```

### `export`

Export the unified environment to a file.

```bash
env export -e <env> -m <modes> [options..]
```

| Option          | Description           | Type            | Default  |
| --------------- | --------------------- | --------------- | -------- |
| `-u, -p, --uri` | Output file path      | `string`        | `.env`   |
| `-f, --format`  | Output format         | `dotenv`/`json` | `dotenv` |
| `-q, --quotes`  | Wrap values in quotes | `boolean`       | `false`  |

```bash
> env export -e dev -m build -f json --uri [[env]].env.json
```

<p align="right">(<a href="#top">back to top</a>)</p>

<!-- PROVIDERS -->

## 📡 Providers

Providers are the core of this library. It ships with **four integrated
providers**, and you can add your own.

### `package-json`

Loads project info from your `package.json` (`version`, `project`, `name`,
`title`, `description`) into `ENV`, `VERSION`, `PROJECT`, `NAME`, `TITLE`,
`DESCRIPTION`.

| Option              | Description                     | Type     | Default |
| ------------------- | ------------------------------- | -------- | ------- |
| `--vp, --varPrefix` | Prefix for the loaded variables | `string` | `""`    |

```bash
# i.e. expose them as REACT_APP_* for CRA
> env -e dev -m build : react-scripts build : --vp REACT_APP_
```

### `app-settings`

Non-secret loader for `appsettings.json`, organized by sections:

```jsonc
{
	"|DEFAULT|": { "VAR1": "v1_default" },
	"|MODE|": {
		"build": { "NODE_ENV": "production" },
		"debug": { "NODE_ENV": "development" },
	},
	"|ENV|": {
		"dev": {
			"C1": "V1",
			"GROUP1": { "VAR2": "G1V2", "GROUP2": { "VAR1": "G1G2V1" } },
		},
	},
	"|LOCAL|": { "dev": { "LOCAL_VAR": "only-local" } },
}
```

| Option            | Description                   | Type     | Default                     |
| ----------------- | ----------------------------- | -------- | --------------------------- |
| `--ef, --envFile` | Non-secret settings file path | `string` | `[[root]]/appsettings.json` |

### `secrets`

Loads secret variables from a per-environment JSON file
(`[[root]]/[[env]].env.json`). Keep this file out of version control.

| Option                | Description                | Type     | Default                     |
| --------------------- | -------------------------- | -------- | --------------------------- |
| `--sf, --secretsFile` | Secret variables file path | `string` | `[[root]]/[[env]].env.json` |

### `local`

Loads local-only variables (never loaded in `--ci`). The file is auto-created
if missing.

| Option              | Description               | Type     | Default                           |
| ------------------- | ------------------------- | -------- | --------------------------------- |
| `--lf, --localFile` | Local variables file path | `string` | `[[root]]/[[env]].local.env.json` |

<p align="right">(<a href="#top">back to top</a>)</p>

<!-- CUSTOM PROVIDERS -->

## ✒️ Creating custom providers

Create a provider in two ways:

- **Local script** — a `.js` file that `export default`s your provider.
- **NPM package** — a published module that `export default`s your provider.

Both are wired in the [config file](#-config) via the `providers` list. A custom
provider can also implement `pull`/`push` to fetch and publish variables from a
remote store (i.e. a vault, a secrets manager or an API).

```typescript
import type { CommandArguments, EnvProvider } from '@calvear/env';
import { logger, readJson, writeJson } from '@calvear/env/utils';

const KEY = 'my-unique-provider-key';

interface MyProviderArguments extends CommandArguments {
	anyExtraOption: boolean;
}

const MyProvider: EnvProvider<MyProviderArguments> = {
	// unique identifier
	key: KEY,

	// (optional) add custom options to the CLI via yargs
	builder: (builder) => {
		builder.options({
			anyExtraOption: {
				group: KEY,
				alias: ['a', 'aeo'],
				type: 'boolean',
				default: false,
				describe: 'Any option description',
			},
		});
	},

	// called on load — may be sync or async, and may return a list to merge
	load: ({ env }) => {
		if (env === 'dev') return { NODE_ENV: 'development' };

		return [{ NODE_ENV: 'production' }, { ANY_GROUP: { INNER_VAR: 12 } }];
	},

	// (optional) called on `env pull`
	pull: (argv, config) => {
		/* fetch variables into your local cache */
	},

	// (optional) called on `env push`
	push: (argv, config) => {
		/* publish/update your variables */
	},
};

export default MyProvider;
```

<p align="right">(<a href="#top">back to top</a>)</p>

<!-- CONFIG -->

## 📥 Config

Any CLI argument can be set in your config file
(`[[root]]/settings/settings.json` by default), but it is mainly used to declare
**providers**:

```jsonc
{
	"logLevel": "silly",
	// mask secrets in the debug output (see the Masking section)
	"logMaskValuesOfKeys": ["SECRET", "/token/i", "/api_key/i"],
	"logMaskAnyRegEx": ["AKIA[0-9A-Z]{16}"],
	"providers": [
		{ "path": "package-json" },
		{ "path": "app-settings" },
		{ "path": "secrets" },
		{ "path": "local" },
		// custom NPM package
		{ "path": "@my-scope/my-provider", "type": "module", "config": {} },
		// custom local script
		{ "path": "scripts/custom-loader.js", "type": "script" },
	],
}
```

> **Provider order matters** — providers are merged in declaration order, so
> later providers override earlier ones (`package-json` is the base, `local`
> wins).

<p align="right">(<a href="#top">back to top</a>)</p>

<!-- SHARED / NESTED -->

## 🪆 Nested & global keys

Organize variables in nested objects. They are **flattened** into `process.env`
using the nesting delimiter (`__` by default):

```jsonc
{
	"GROUP1": {
		"VAR": "anyValue1",
		"GROUP2": { "VAR": "anyValue2" },
	},
	"VAR3": "anyValue3",
}
```

```javascript
process.env.GROUP1__VAR; // "anyValue1"
process.env.GROUP1__GROUP2__VAR; // "anyValue2"
process.env.VAR3; // "anyValue3"
```

### `$` global marker

Prefix a key with `$` to mark it as **global/shared** — relevant for the
`secrets` provider, which uses the marker to scope the secret across the project
rather than per-mode. The marker is **stripped on injection** at any nesting
depth, while the group prefix is **kept**:

```jsonc
{
	"$TOKEN": "rootValue",
	"GROUP1": {
		"$SHARED": "groupValue",
		"VAR": "anyValue",
	},
}
```

```javascript
// the `$` is removed; the nesting prefix is preserved
process.env.TOKEN; // "rootValue"        (was $TOKEN)
process.env.GROUP1__SHARED; // "groupValue"  (was GROUP1.$SHARED)
process.env.GROUP1__VAR; // "anyValue"
```

> The `$` is removed only from the **process environment** and from JSON Schema
> validation keys. It is **preserved** in the secrets file storage, so the
> `secrets` provider round-trips the global marker intact.
>
> Skip a key entirely (never injected) by prefixing it with `#`.

### Priority (lowest → highest)

1. `package-json` info
2. `appsettings.json` (`app-settings`)
3. `<env>.env.json` (`secrets`)
4. `<env>.local.env.json` (`local`, skipped in `--ci`)

<p align="right">(<a href="#top">back to top</a>)</p>

<!-- MASKING -->

## 🙈 Masking secrets

When the resolved environment is rendered (at `--log debug`) and when objects
are logged, secrets are masked as `*****`. There are two complementary
mechanisms, configurable via CLI flags or the [config file](#-config):

### By key — `logMaskValuesOfKeys` (`--mvk`)

Masks a variable's **whole value** when its **key** matches. Each entry is
either an **exact key name** (case-insensitive) or a `/source/flags` **regex**
matched against the key:

```jsonc
{
	"logMaskValuesOfKeys": [
		"PASSWORD", // exact key (case-insensitive)
		"/token/i", // any key containing "token"
		"/_secret$/i", // any key ending in "_secret"
	],
}
```

```bash
# same, via CLI flag
> env -e dev --log debug --mvk PASSWORD "/token/i" : node app.js
```

### By value content — `logMaskAnyRegEx` (`--mrx`)

Masks **only the matching portion** of any string value, wherever it appears.
The global flag is always forced, so **every** occurrence is masked; use the
`/source/flags` form for extra flags such as `i`:

```jsonc
{
	"logMaskAnyRegEx": [
		"AKIA[0-9A-Z]{16}", // AWS access key ids
		"/bearer .+/i", // bearer tokens (case-insensitive)
	],
}
```

| Goal                                                | Use                   |
| --------------------------------------------------- | --------------------- |
| Know the **key** of the secret                      | `logMaskValuesOfKeys` |
| Know the **shape** of the secret (token, key, RUT…) | `logMaskAnyRegEx`     |

> In JSON the backslash must be escaped: write `\\d` for `\d`. Neither mechanism
> masks the variable **name** — keys are always shown. Masking only affects the
> output; the real (unmasked) values are still injected into `process.env`.

<p align="right">(<a href="#top">back to top</a>)</p>

<!-- SCRIPTS -->

## 🧰 Development scripts

| Script               | Description                                       |
| -------------------- | ------------------------------------------------- |
| `pnpm build`         | Build the library (Vite, ESM) into `dist/`        |
| `pnpm test`          | Run unit tests (Vitest)                           |
| `pnpm test:cov`      | Run unit tests with coverage (100% threshold)     |
| `pnpm test:int`      | Run integration tests against the built binary    |
| `pnpm typecheck`     | Type-check with `tsc --noEmit`                    |
| `pnpm lint`          | Lint with ESLint (flat config)                    |
| `pnpm format`        | Format with Prettier                              |
| `pnpm run pub`       | Gate + build + publish to npm (`latest`)          |
| `pnpm run pub:alpha` | Gate + build + publish a prerelease (`alpha` tag) |

<p align="right">(<a href="#top">back to top</a>)</p>

<!-- BUILT WITH -->

## 🛠️ Built with

- [yargs](http://yargs.js.org/) — CLI argument parsing
- [ajv](https://ajv.js.org/) + [to-json-schema](https://www.npmjs.com/package/to-json-schema) — JSON Schema
- [tslog](https://tslog.js.org/#/) — logging
- [picocolors](https://github.com/alexeyraspopov/picocolors) — terminal colors
- [subslate](https://github.com/josh-hemphill/subslate) — interpolation
- [merge-deep](https://github.com/jonschlinkert/merge-deep) — deep merge
- [Vite](https://vite.dev/) — build · [Vitest](https://vitest.dev/) — testing

<p align="right">(<a href="#top">back to top</a>)</p>

<!-- LICENSE -->

## 📄 License

This project is licensed under the **MIT License** — see [LICENSE.md](LICENSE.md)
for details.

<p align="right">(<a href="#top">back to top</a>)</p>

---

<p align="center">
  ⌨ with ❤️ by <a href="https://github.com/calvear93">Alvear Candia, Cristopher Alejandro</a>
</p>
