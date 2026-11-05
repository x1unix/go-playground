# Web UI

Frontend for the Go Playground application.

Use Node.js 22.22.0 (`nvm install && nvm use` from the repository root) and
Corepack with the Yarn version pinned in `package.json`.

## Run in development

Start the frontend from the repository root:

```bash
make ui
```

Use `make ui` instead of `yarn start` in `web/`. The Makefile injects required environment variables (for example
`VITE_VERSION`, `VITE_GITHUB_URL`, and WASM settings) and wires the expected API proxy settings.

By default, Vite serves the app on `http://localhost:3000`.

## Tech stack

- React 18 (`react`, `react-dom`)
- TypeScript 7 native compiler for type checking
- Vite 7 with SWC (`@vitejs/plugin-react-swc`)
- Fluent UI (`@fluentui/react`, `@fluentui/react-icons`)
- CodeMirror 6 ecosystem (`@codemirror/*`, Replit keymaps, VS Code theme)
- State and routing: Redux + React Redux, `connected-react-router`, React Router v5
- Terminal integration: xterm.js (`@xterm/xterm` + addons)
- Testing: Vitest + Testing Library + JSDOM
- Linting/formatting: ESLint 9 + `typescript-eslint` + Prettier

## Checks

Run these commands in `web/`:

```bash
corepack yarn install --immutable
corepack yarn typecheck
corepack yarn lint
corepack yarn test run --coverage
corepack yarn build
```

`typecheck` checks application/test sources and `vite.config.ts`. Production
builds also run it before bundling. Vite and regular Vitest tests transpile with
their own tooling; they do not replace compiler checking.

The `@typescript/native` dependency aliases TypeScript 7 and supplies `tsc`.
The `typescript` dependency aliases `@typescript/typescript6` for ESLint and
other tools that need the JavaScript compiler API; it supplies `tsc6`.
Keep both dependencies: replacing the compatibility alias with TypeScript 7
would break those API consumers. Yarn 4.18.1 handles the compatibility package
and selects the direct native compiler's executable correctly.

`vite-tsconfig-paths` stays on stable 6.1.1 with its default parser
(`parseNative` is disabled). Version 7 is currently an alpha, so it is not
required for this migration. Vitest and `@vitest/coverage-v8` stay aligned at
4.1.11, and test globals come from `vitest/globals` rather than Jest types.

## Environment variables

Frontend values are exposed through `VITE_*` variables:

- `VITE_VERSION` - application version string shown in the UI/build metadata.
- `VITE_GITHUB_URL` - repository URL used for source/issues links in the UI.
- `VITE_WASM_API_VER` - WebAssembly API version used when resolving WASM endpoints.
- `VITE_WASM_BASE_URL` - base URL where WASM assets and API routes are served.
- `VITE_BASE_URL` - optional frontend base path when app is hosted under a subpath.

Most of these are injected by the root `Makefile` when you run `make ui`.
