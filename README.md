<h2 align="center">
  <img alt="logo" src="assets/logo.png" width="256px"/>
  <br/>
  <strong styles="with=800px">env</strong>
</h2>

<h3 align="center">
  ¡Environment variables handler made easy!
</h3>

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

## 📖 About

The aim of this library is ease NodeJS <b>environment variable handling</b>, like [env-cmd](https://www.npmjs.com/package/env-cmd) or [dotenv](https://www.npmjs.com/package/dotenv), but with <b>powerfull features and extensibility</b> for adding custom providers (as plugins) for <u>load</u>, <u>pull</u> and <u>push</u> the variables from different stores.

<p align="right">(<a href="#top">back to top</a>)</p>

## ⚡️ Quick start

```bash
npm install @calvear/env
```

> 🔔 Make sure that you have [NodeJS 14+](https://nodejs.org/) installed on your computer.

<p align="right">(<a href="#top">back to top</a>)</p>

## 📌 Requirements

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

## ⚙️ Commands & Options

### **[>_] `env`**

Load your environment variables into a subcommand.

```bash
env [OPTION]
```

| Option | Description | Type   | Default | Required? |
| ------ | ----------- | ------ | ------- | --------- |
| `-t`   | dem.        | `bool` | `false` | No        |

### `deploy`

CLI command for deploy Docker containers with your project via Ansible to the remote server.

```bash
ts deploy [OPTION]
```

| Option | Description                                                                                            | Type   | Default | Required? |
| ------ | ------------------------------------------------------------------------------------------------------ | ------ | ------- | --------- |
| `-k`   | Prompt you to provide the remote user sudo password (_a standard Ansible `--ask-become-pass` option_). | `bool` | `false` | No        |

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
