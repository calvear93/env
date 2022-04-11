<div id="top" align="center">
  <img
    alt="logo"
    src="https://nodejs.org/static/images/logo.svg"
    width="256px"
  />

  </br>

  <h1><b>env</b></h1>
  <h4>¡Environment variables made easy!</h4>
</div>

<br />

<p align="center">
  <img
    src="https://img.shields.io/badge/version-1.0.0-blue?style=flat-square"
    alt="version"
  />
  &nbsp;
  <img
    src="https://img.shields.io/badge/TypeScript-007ACC?style=flat-square&logo=typescript&logoColor=white"
    alt="typescript"
  />
  &nbsp;
  <img
    src="https://img.shields.io/badge/nodejs-~14.0.0_||_^16.14.2-darkgreen?style=flat-square"
    alt="nodejs engine"
  />
  &nbsp;
  <img
    src="https://img.shields.io/badge/npm->=7.5.6-darkgreen?style=flat-square"
    alt="npm engine"
  />
  &nbsp;
  <img
    src="https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square"
    alt="license"
  />
</p>

<br />

<!-- ABOUT THE PROJECT -->

## 📖 **About**

Eases NodeJS <b>environment variable handling</b>, like [env-cmd](https://www.npmjs.com/package/env-cmd) or [dotenv](https://www.npmjs.com/package/dotenv), but with <b>powerfull features and extensibility</b> for adding custom providers (as plugins) for <u>load</u>, <u>pull</u> and <u>push</u> the variables from different stores.

<p align="right">(<a href="#top">back to top</a>)</p>

<!-- REQUIREMENTS -->

## 📌 **Requirements**

First, [download](https://nodejs.org/) and install **NodeJS**. Version `16` or higher is required.

Validate installed versions of node and npm with:

```bash
> node -v
v16.14.2

> npm -v
8.3.0
```

You can initialize a new npm project using:

```bash
> npm init
```

<p align="right">(<a href="#top">back to top</a>)</p>

<!-- QUICK START -->

## ⚡️ **Quick start**

> 🔔 Make sure that you have [NodeJS 14+](https://nodejs.org/) installed on your computer.

-   Installs the package:

```bash
> npm install @calvear/env

  added 1 packages, and audited 1 packages in 1s

  found 0 vulnerabilities

> _
```

-   Executes binary directly:

```bash
> node_modules/.bin/env --help

  Usage: env [command] [options..] [: subcmd [:]] [options..]

  Commands:
    env [options..] [: <subcmd> :]
    env pull [options..]
    env push [options..]
    env schema [options..]

> _
```

-   Or add desired commands in your **npm script** in `package.json`:

```javascript
{
  ...,
  "scripts": {
    // starts project injecting "dev" environment variables and debug log level
    "start:dev": "env -e dev -m debug : node dist/main.js : --log debug",
    // starts project injecting "prod" environment variables
    "start:prod": "env -e prod -m debug : node dist/main.js",
    ...,
    // builds project injecting "prod" environment variables
    "build:prod": "env -e prod -m build : tsc",
    ...,
    "env:schema": "env schema -e dev",
    // uploads environment "dev" variables
    "env:push:dev": "env push -e dev",
    // downloads environment "dev" variables
    "env:pull:dev": "env pull -e dev"
  },
  ...
}
```

-   Execs your command:

**file**: _dist/main.js_

```javascript
console.log(`My environment loaded is: ${process.env.ENV}`);
```

```bash
> npm run start:dev

  13:31:59.865 INFO  loading dev environment in debug mode
  13:31:59.911 DEBUG using package-json provider
  13:31:59.912 DEBUG using app-settings provider
  13:31:59.914 DEBUG using secrets provider
  13:32:00.109 DEBUG environment loaded:
  {
    NODE_ENV: 'development',
    ENV: 'dev',
    VERSION: '1.0.0',
    NAME: '@my-app',
    VAR1: true,
    VAR2: true,
    GROUP1__VAR1: 'G1V2',
    ARR1: '1,val,true',
    SECRET: '***'
  }
  13:32:00.116 INFO  executing command > node dist/main.js
  My environment loaded is: dev
  13:32:00.232 INFO  process finished successfully

> _
```

<p align="right">(<a href="#top">back to top</a>)</p>

## ⛩ **Structure**

```bash
├── src/
│   ├── commands/ # lib commands handlers
│   │   ├── env.command.ts
│   │   ├── export.command.ts
│   │   ├── pull.command.ts
│   │   ├── push.command.ts
│   │   └── schema.command.ts
│   ├── interfaces/ # provider interfaces
│   ├── providers/ # integrated providers
│   │   ├── package-json.provider.ts
│   │   ├── app-settings.provider.ts
│   │   └── secrets.provider.ts
│   ├── utils/
│   │   ├── command.util.ts
│   │   ├── interpolate.util.ts
│   │   ├── json.util.ts
│   │   ├── normalize.util.ts
│   │   ├── schema.util.ts
│   │   └── logger.ts
│   ├── arguments.ts # global arguments
│   ├── exec.ts # initialization logic (load config, commands, etc.)
│   └── main.ts
├── tests/ # integration tests
├── .eslintrc.json
├── jest.config.json
├── tsconfig.build.json
└── tsconfig.json
```

<p align="right">(<a href="#top">back to top</a>)</p>

<!-- COMMANDS AND OPTIONS -->

## ⚙️ **Commands & Options**

Options handling has the ability of **replace arguments itself**, using `[[` and `]]` as delimiters.
So, in example for define your config file path, you must use your _root_ argument,
supposing root has the value of "config", this definition _`[[root]]/any-config-file.json`_ will be
_`config/any-config-file.json`_, or if your _env_ argument is "dev", this definition
_`[[root]]/config-file.[[env]].json`_ will be _`config/config-file.dev.json`_.

<div align="center">
  <span style="font-size:20px;font-weight:bold" align="center">Options</span>
</div>

### Global options

| Option                             | Description                            | Type       | Default | Required? |
| ---------------------------------- | -------------------------------------- | ---------- | ------- | --------- |
| `--help`                           | Shows help                             | `boolean`  |         | No        |
| `--e, --env`                       | Environment for load                   | `string`   |         | Yes       |
| `-m, --modes`                      | Execution modes                        | `string[]` | `[]`    | No        |
| `--nd, --nestingDelimiter`         | Nesting level delimiter for flatten    | `string`   | `__`    | No        |
| `--arrDesc, --arrayDescomposition` | Whether serialize or break down arrays | `boolean`  | `false` | No        |

</br>

### Workspace options

| Option             | Description                       | Type     | Default                    | Required? |
| ------------------ | --------------------------------- | -------- | -------------------------- | --------- |
| `--root`           | Default environment folder path   | `string` | `env`                      | No        |
| `-c, --configFile` | Config JSON file path             | `string` | `[[root]]/env.config.json` | No        |
| `-s, --schemaFile` | Environment Schema JSON file path | `string` | `[[root]]/env.schema.json` | No        |

### JSON Schema options

| Option                 | Description                                                | Type              | Default | Required? |
| ---------------------- | ---------------------------------------------------------- | ----------------- | ------- | --------- |
| `-r, --resolve`        | Whether merges new schema or override                      | `merge, override` | `merge` | No        |
| `--null, --nullable`   | Whether variables are nullable by default                  | `boolean`         | `true`  | No        |
| `--df, --detectFormat` | Whether format of strings variables are included in schema | `boolean`         | `true`  | No        |

### Logger options

| Option              | Description | Type                                     | Default | Required? |
| ------------------- | ----------- | ---------------------------------------- | ------- | --------- |
| `--log, --logLevel` | Log level   | `silly, trace, debug, info, warn, error` | `info`  | No        |

<div align="center">
  <span style="font-size:20px;font-weight:bold" align="center">Commands</span>
</div>

-   ## **`env`**

Inject your environment variables into `process.env` and executes a command.

```bash
env -e [env] [options..] [: subcmd [:]] [options..]
```

Examples:

```bash
> env -e dev -m test unit : npm test
```

```bash
> env -e dev -m debug : npm start : -c [[root]]/[[env]].env.json
```

```bash
> env -e prod -m build optimize : npm build
```

-   ## **`pull`**

Pulls environment variables from providers stores.

```bash
env pull -e [env] [options..]
```

| Option            | Description               | Type      | Default | Required? |
| ----------------- | ------------------------- | --------- | ------- | --------- |
| `-o, --overwrite` | Overwrite local variables | `boolean` | `false` | No        |

Examples:

```bash
> env pull -e dev
```

-   ## **`push`**

Pushes environment variables to providers stores.

```bash
env push -e [env] [options..]
```

| Option        | Description                          | Type      | Default | Required? |
| ------------- | ------------------------------------ | --------- | ------- | --------- |
| `-f, --force` | Force push for secrets (replace all) | `boolean` | `false` | No        |

Examples:

```bash
> env push -e dev
```

-   ## **`schema`**

Generates validation schema from providers output variables.

```bash
env schema -e [env] -m [modes] [options..]
```

Examples:

```bash
> env schema -e dev -m build
```

-   ## **`export`**

Export unified environment variables to a file from providers.

```bash
env export -e [env] -m [modes] [options..]
```

| Option          | Description                        | Type     | Default  | Required? |
| --------------- | ---------------------------------- | -------- | -------- | --------- |
| `-u, -p, --uri` | Uri for export file with variables | `string` | `.env`   | No        |
| `-f, --format`  | Format for export variables        | `string` | `dotenv` | No        |

Examples:

```bash
> env export -e dev -m build -f json --uri [[env]].env.json
```

<p align="right">(<a href="#top">back to top</a>)</p>

<!-- PROVIDERS -->

## 📡 **Providers**

Main feature of this library is using providers for get and set environment variables.
So, you cand define your own provider, but lib came with 3 integrated providers:

-   ## **`package-json`**

Load some info from your project `package.json`.

Info read is:

```json
{
    "version": "1.0.0",
    "project": "project-name",
    "name": "@package-name",
    "title": "app-name",
    "description": "any description"
}
```

| Option              | Description                 | Type     | Default | Required? |
| ------------------- | --------------------------- | -------- | ------- | --------- |
| `--vp, --varPrefix` | Prefix for loaded variables | `string` | `""`    | No        |

Examples:

```bash
> env -e dev -m build : react-script build : --vp REACT_APP_
```

</br>

-   ## **`app-settings`**

Non secrets loader for `appsettings.json`.

`appsettings.json` file has the format below:

```json
{
    "|DEFAULT|": {},
    "|MODE|": {},
    "|ENV|": {}
}
```

In example:

```json
{
    "|DEFAULT|": {
        "VAR1": "v1_default"
    },
    "|MODE|": {
        "build": {
            "NODE_ENV": "production"
        },
        "debug": {
            "NODE_ENV": "development"
        },
        "test": {
            "NODE_ENV": "test"
        }
    },
    "|ENV|": {
        "dev": {
            "C1": "V1",
            "C2": "V2",
            "C3": 3,
            "GROUP1": {
                "VAR1": null,
                "VAR2": "G1V2",
                "VAR3": true,
                "GROUP2": {
                    "VAR1": "G1G2V1"
                }
            },
            "C4": "23"
        }
    }
}
```

| Option                  | Description                          | Type     | Default                     | Required? |
| ----------------------- | ------------------------------------ | -------- | --------------------------- | --------- |
| `--ef, --envFile`       | Environment variables file path      | `string` | `[[root]]/appsettings.json` | No        |
| `--sp, --sectionPrefix` | Prefix for env and modes in env file | `string` | ``                        | No        |

</br>

-   ## **`secrets`**

Secrets loader for `env/secrets/[[env]].env.json` and `env/secrets/[[env]].local.env.json`.

| Option                     | Description                      | Type     | Default                                   | Required? |
| -------------------------- | -------------------------------- | -------- | ----------------------------------------- | --------- |
| `--sf, --secretFile`       | Secret variables file path       | `string` | `[[root]]/secrets/[[env]].env.json`       | No        |
| `--lsf, --localSecretFile` | Local secret variables file path | `string` | `[[root]]/secrets/[[env]].local.env.json` | No        |

-   ## **`package-json`**

Load some info from your project `package.json`.

Info read is:

```json
{
    "version": "1.0.0",
    "project": "project-name",
    "name": "@package-name",
    "title": "app-name",
    "description": "any description"
}
```

| Option              | Description                 | Type     | Default | Required? |
| ------------------- | --------------------------- | -------- | ------- | --------- |
| `--vp, --varPrefix` | Prefix for loaded variables | `string` | `""`    | No        |

Examples:

```bash
> env -e dev -m build : react-script build : --vp REACT_APP_
```

<p align="right">(<a href="#top">back to top</a>)</p>

<!-- PROVIDERS -->

## ✒ **Creating Custom Providers**

You can create your custom providers, in two ways:

-   **Local Script**: you must create a JavaScript file (.js), exporting by default your "provider" following standard interface exported by this lib.
-   **NPM Package**: you must create your custom NPM library and export by default your "provider" using standard interface exported by this lib.

How to load your provider is shown in Config Section.

In example, a provider exported by your NPM package written in TypeScript should be like:

```typescript
import { CommandArguments, EnvProvider } from '@calvear/env';
import { logger, readJson, writeJson } from '@calvear/env/utils';

const KEY = 'my-unique-provider-key';

interface MyProviderCommandArguments extends CommandArguments {
    anyExtraOption: boolean;
}

export const MyProvider: EnvProvider<MyProviderCommandArguments> = {
    // unique identifier for provider
    key: KEY,

    // (optional) allows to provider adds new arguments/options
    // to commands using yargs for builder
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

    // call on environment variables loading,
    // may be a Promise
    load: ({ env, modes, ...options }) => {
        if (env === 'dev')
            return {
                NODE_ENV: 'development',
            };

        // you can return a list of JSON environment variables for merge
        return [
            {
                NODE_ENV: 'production',
            },
            {
                ANY_VAR: 'ANY_VALUE',
                ANY_GROUP: {
                    INNER_VAR: 12,
                },
            },
        ];
    },

    // (optional) call on pulling variables from provider store,
    // config may pass in your config file
    pull: ({ env, modes, ...options }, config) => {
        // anyway you want for pulling variables to cache
    },

    // (optional) call on pushing/updating variables to provider store,
    // config may pass in your config file
    push: ({ env, modes, ...options }, config) => {
        // anyway you should do for pushing or updating your variables
    },
};
```

<p align="right">(<a href="#top">back to top</a>)</p>

<!-- CONFIG -->

## 📥 **Config**

You can configure any config argument inside you config file, but commonly providers are designed for this purpose.

```javascript
{
    "log": "silly",
    // will hide values of keys SECRET and MY_API_KEY in logging
    "logMaskValuesOfKeys": ["SECRET", "MY_API_KEY"],
    // integrated providers and custom providers together
    "providers": [
        {
            "path": "package-json",
            "type": "integrated"
        },
        {
            "path": "app-settings",
            "type": "integrated"
        },
        {
            "path": "secrets",
            "type": "integrated"
        },
        {
            // custom NPM package
            "path": "@npm-package",
            "type": "module",
            "config": {
                "any-config": "any value"
            }
        },
        {
            // custom script inside project
            "path": "scripts/custom-loader.js",
            "type": "script"
        }
    ]
}
```

<!-- ROADMAP -->

## 📑 Roadmap

-   [x] Environment injection handling
-   [x] Customizable variables store providers
-   [x] Commands
    -   [x] `push` executes a pushing action over every providers
    -   [x] `pull` executes a pulling action over every providers
    -   [x] `schema` regenerates JSON schema using providers output
    -   [x] `export` exports environment variables in json or dotenv format
    -   [ ] `prepare` prepares environment (creates folder and files required)
-   [ ] Improve documentation
-   [ ] Providers pull history
-   [ ] Providers pull and push difference calc and prompts
-   [ ] Providers dependsOn option
-   [ ] Programatic module

<p align="right">(<a href="#top">back to top</a>)</p>

## 🧿 **Linting**

Project uses ESLint, for code formatting and code styling normalizing.

-   **eslint**: linter integrated with TypeScript.

For correct interpretation of linters, is recommended to use [Visual Studio Code](https://code.visualstudio.com/) as IDE and install the plugins in .vscode folder at 'extensions.json', as well as use the config provided in 'settings.json'

<p align="right">(<a href="#top">back to top</a>)</p>

<!-- CHANGELOG -->

## 📋 Changelog

For last changes see [CHANGELOG.md](CHANGELOG.md) file for details.

<p align="right">(<a href="#top">back to top</a>)</p>

<!-- BUILT WITH -->

## 🛠️ Built with

-   [yargs](http://yargs.js.org/)
-   [tslog](https://tslog.js.org/#/)
-   [subslate](https://github.com/josh-hemphill/subslate)
-   [merge-deep](https://github.com/jonschlinkert/merge-deep)
-   [ajv](https://ajv.js.org/)
-   [to-json-schema](https://www.npmjs.com/package/to-json-schema)

<p align="right">(<a href="#top">back to top</a>)</p>

<!-- LICENSE -->

## 📄 License

This project is licensed under the MIT License - see [LICENSE.md](LICENSE.md) file for details.

<p align="right">(<a href="#top">back to top</a>)</p>

---

⌨ by [Alvear Candia, Cristopher Alejandro](https://github.com/calvear93)
