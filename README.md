<div align="center">
  <img alt="logo" src="assets/logo.png" width="256px"/>
  <br/>
  <span style="font-size:48px;font-weight:bolder">env</span>
</div>

<h2 align="center">
  ¡Environment variables made easy!
</h2>

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

<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
      <ul>
        <li><a href="#built-with">Built With</a></li>
      </ul>
    </li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#installation">Installation</a></li>
      </ul>
    </li>
    <li><a href="#usage">Usage</a></li>
    <li><a href="#roadmap">Roadmap</a></li>
    <li><a href="#contributing">Contributing</a></li>
    <li><a href="#license">License</a></li>
    <li><a href="#contact">Contact</a></li>
    <li><a href="#acknowledgments">Acknowledgments</a></li>
  </ol>
</details>

<br />

<!-- ABOUT THE PROJECT -->

## 📖 **About**

Eases NodeJS <b>environment variable handling</b>, like [env-cmd](https://www.npmjs.com/package/env-cmd) or [dotenv](https://www.npmjs.com/package/dotenv), but with <b>powerfull features and extensibility</b> for adding custom providers (as plugins) for <u>load</u>, <u>pull</u> and <u>push</u> the variables from different stores.

<p align="right">(<a href="#top">back to top</a>)</p>
&nbsp;

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

```json
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
&nbsp;

## 📌 **Requirements**

First, [download](https://nodejs.org/) and install **NodeJS**. Version `14` or higher is required.

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

### Built With

-   [yargs](http://yargs.js.org/)
-   [tslog](https://tslog.js.org/#/)
-   [subslate](https://github.com/josh-hemphill/subslate)
-   [merge-deep](https://github.com/jonschlinkert/merge-deep)
-   [ajv](https://ajv.js.org/)
-   [to-json-schema](https://www.npmjs.com/package/to-json-schema)

<p align="right">(<a href="#top">back to top</a>)</p>

<!-- GETTING STARTED -->

## Getting Started

This is an example of how you may give instructions on setting up your project locally.
To get a local copy up and running follow these simple example steps.

### Prerequisites

This is an example of how to list things you need to use the software and how to install them.

-   npm
    ```sh
    npm install npm@latest -g
    ```

### Installation

1. Get a free API Key at [https://example.com](https://example.com)
2. Clone the repo
    ```sh
    git clone https://github.com/github_username/repo_name.git
    ```
3. Install NPM packages
    ```sh
    npm install
    ```
4. Enter your API in `config.js`
    ```js
    const API_KEY = 'ENTER YOUR API';
    ```

<p align="right">(<a href="#top">back to top</a>)</p>

<!-- USAGE EXAMPLES -->

## Usage

Use this space to show useful examples of how a project can be used. Additional screenshots, code examples and demos work well in this space. You may also link to more resources.

_For more examples, please refer to the [Documentation](https://example.com)_

<p align="right">(<a href="#top">back to top</a>)</p>

<!-- ROADMAP -->

## Roadmap

-   [ ] Feature 1
-   [ ] Feature 2
-   [ ] Feature 3
    -   [ ] Nested Feature

See the [open issues](https://github.com/github_username/repo_name/issues) for a full list of proposed features (and known issues).

<p align="right">(<a href="#top">back to top</a>)</p>

<!-- LICENSE -->

## License

Distributed under the MIT License. See `LICENSE.txt` for more information.

<p align="right">(<a href="#top">back to top</a>)</p>
