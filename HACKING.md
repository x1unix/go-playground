# Better Go Playground Development Guide

## Introduction

Welcome, gentle reader. This document explains project structure and describes steps to setup a development environment.

If you have any suggestions to improve this document, please feel free to submit a PR.

## Glossary

| Term | Description                 |
| ---- | --------------------------- |
| FE   | Front-end web application.  |
| BE   | Back-end, REST API service. |
| WASM | WebAssembly.                |

## Project Components

### Backend

REST API service (BE) written in Go which is responsible for:

- Proxying requests to [original Go Playground](https://go.dev/play) to get snippets and run programs.
- Building WebAssembly executables to run programs in a browser.
- Provide basic autocomplete for Go standard library symbols in editor.

> [!NOTE]
> Server main package is located in [`cmd/playground`](./cmd/playground/) directory.

### Front-end App

Front-end app (FE) provides user interface to write and execute Go programs in browser.

App is written in TypeScript and uses following libraries and tools:

- React
- Redux
- [CodeMirror](https://codemirror.net/)
- [Fluent UI React](https://developer.microsoft.com/en-us/fluentui#/controls/web) components library.
- [Vite](https://vitejs.dev/)

> [!NOTE]
> FE app is located in [`web`](./web) directory.

### WebAssembly Programs

FE app relies on a set of WASM programs written in Go for language-specific tasks like syntax checking and etc.

WASM Go programs are located in [`cmd/wasm`](./cmd/wasm/) directory.

| Package    | Description                    |
| ---------- | ------------------------------ |
| `analyzer` | Very simple Go syntax checker. |

### Tools & Scripts

Project uses a set of Go programs to prepare assets necessary for a project.

| Name         | Description                                                                      |
| ------------ | -------------------------------------------------------------------------------- |
| `pkgindexer` | Collects list of Go packages and symbols into JSON file for FE app autocomplete. |

> [!NOTE]
> Tools are located in [`tools`](./tools) directory.

## Development Environment Setup

### Nix development shell (recommended)

With Nix installed and flakes enabled, enter the development environment from the repository root:

```sh
nix develop
```

The shell provides Go 1.26, Node.js 22, Corepack, Yarn, Make, Git, a C compiler, Mockgen, and Protobuf tools on x86_64/aarch64 Linux and Apple Silicon macOS. `flake.lock` pins the toolchain; the Yarn wrapper uses Corepack to run the version declared in `web/package.json`, including when invoked from the repository root. Corepack may download Yarn on first use. NVM and system-installed Go or Node.js are not required.

Inside the shell, complete the **First-time setup** below, skipping `corepack enable` because the shell already provides Yarn. Enter the shell in each terminal used to run the project. You can also run individual commands with `nix develop -c make wasm`.

To update the pinned toolchain, run `nix flake update` and commit the updated `flake.lock`.

### Manual prerequisites

Please ensure that you have installed:

- GNU or BSD Make
- Git
- Node.js 22 (see `.nvmrc` for the version used by CI; NVM is optional)
- Corepack, which selects the Yarn version from `web/package.json`.
- Go 1.26+
- A C compiler for cgo.
- [Mockgen](https://github.com/uber-go/mock) for `make gen`.
- Protobuf:
  - [protoc](https://developers.google.com/protocol-buffers)
  - [Protobuf Go plugins](https://grpc.io/docs/languages/go/quickstart/)

### First-time setup

Run following commands to configure a just cloned project:

`make install` is reserved for installing a built project on a local machine; it is not a development setup command.

| Command           | Purpose                                                                                                     |
| ----------------- | ----------------------------------------------------------------------------------------------------------- |
| `corepack enable` | Enables [Corepack](https://nodejs.org/api/corepack.html) to use package manager version from `package.json` |
| `make preinstall` | Installs NPM packages for a web app.                                                                        |
| `make wasm`       | Builds WebAssembly binaries used by the web app.                                                            |
| `make go-index`   | Generates Go packages index for autocomplete in web app.                                                    |

### Running Project

> [!IMPORTANT]
> If you see `command not found: yarn` error, please ensure that Corepack is enabled.
> See **First-time setup** section.

Front-end web app and Go API server are executed using separate make commands:

| Command    | Purpose                              |
| ---------- | ------------------------------------ |
| `make run` | Starts Go API web server.            |
| `make ui`  | Starts Vite dev server with web app. |

Backend is running at port `8000` and front-end is running on port `3000`.

> [!TIP]
> All API requests to backend are already proxied by Vite dev server.
