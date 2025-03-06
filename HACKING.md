# Better Go Playground Development Guide

## Introduction

Welcome, gentle reader. This document explains project structure and describes steps to setup a development environment.

If you have any suggestions to improve this document, please feel free to submit a PR.

## Glossary

| Term | Description                 |
|------|-----------------------------|
| FE   | Front-end web application.  |
| BE   | Back-end, REST API service. |
| WASM | WebAssembly.                |

## Project Components

### Backend

REST API service (BE) written in Go which is responsible for:

* Proxying requests to [original Go Playground](https://go.dev/play) to get snippets and run programs.
* Building WebAssembly executables to run programs in a browser.
* Provide basic autocomplete for Go standard library symbols in editor.

> [!NOTE]
> Server main package is located in [`cmd/playground`](./cmd/playground/) directory.

### Front-end App

Front-end app (FE) provides user interface to write and execute Go programs in browser.

App is written in TypeScript and uses following libraries and tools:

* React
* Redux
* [Monaco editor](https://microsoft.github.io/monaco-editor/)
* [Fluent UI React](https://developer.microsoft.com/en-us/fluentui#/controls/web) components library.
* [Vite](https://vitejs.dev/)

> [!NOTE]
> FE app is located in [`web`](./web) directory.

### WebAssembly Programs

FE app relies on a set of WASM programs written in Go for language-specific tasks like syntax checking and etc.

WASM Go programs are located in [`cmd/wasm`](./cmd/wasm/) directory.

| Package    | Description                    |
|------------|--------------------------------|
| `analyzer` | Very simple Go syntax checker. |

### Tools & Scripts

Project uses a set of Go programs to prepare assets necessary for a project.

| Name         | Description                                                                      |
|--------------|----------------------------------------------------------------------------------|
| `pkgindexer` | Collects list of Go packages and symbols into JSON file for FE app autocomplete. |

> [!NOTE]
> Tools are located in [`tools`](./tools) directory.

## Development Environment Setup

### Prerequisites

Please ensure that you have installed:

* GNU or BSD Make
* Git
* [Node Version Manager](https://github.com/nvm-sh/nvm) or Node.js 20 (`lts/iron`)
* [Yarn](https://yarnpkg.com/) package manager.
* Go 1.24+
* Protobuf:
  * [protoc](https://developers.google.com/protocol-buffers)
  * [Protobuf Go plugins](https://grpc.io/docs/languages/go/quickstart/)

### First-time setup

Run following commands to configure a just cloned project:

| Command           | Purpose                                                                                                     |
|-------------------|-------------------------------------------------------------------------------------------------------------|
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
|------------|--------------------------------------|
| `make run` | Starts Go API web server.            |
| `make ui`  | Starts Vite dev server with web app. |

Backend is running at port `8000` and front-end is running on port `3000`.

> [!TIP]
> All API requests to backend are already proxied by Vite dev server.
