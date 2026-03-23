# Web UI

Frontend for the Go Playground application.

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
- TypeScript 5
- Vite 5 with SWC (`@vitejs/plugin-react-swc`)
- Fluent UI (`@fluentui/react`, `@fluentui/react-icons`)
- CodeMirror 6 ecosystem (`@codemirror/*`, Replit keymaps, VS Code theme)
- State and routing: Redux + React Redux, `connected-react-router`, React Router v5
- Terminal integration: xterm.js (`@xterm/xterm` + addons)
- Testing: Vitest + Testing Library + JSDOM
- Linting/formatting: ESLint 9 + `typescript-eslint` + Prettier

## Environment variables

Frontend values are exposed through `VITE_*` variables:

- `VITE_VERSION` - application version string shown in the UI/build metadata.
- `VITE_GITHUB_URL` - repository URL used for source/issues links in the UI.
- `VITE_WASM_API_VER` - WebAssembly API version used when resolving WASM endpoints.
- `VITE_WASM_BASE_URL` - base URL where WASM assets and API routes are served.
- `VITE_BASE_URL` - optional frontend base path when app is hosted under a subpath.

Most of these are injected by the root `Makefile` when you run `make ui`.
