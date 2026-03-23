# React 17 -> React 18 Migration Plan

## Goal

Upgrade the web app to React 18 to resolve JSX typing issues such as:

`Type 'undefined' is not assignable to type 'Element | null'`

while keeping `connected-react-router` in place for now.

## Current State (observed)

- Runtime dependencies are React 17 (`react`, `react-dom`).
- Root type dependencies are `@types/react` 17 and `@types/react-dom` 17.
- Transitive dependencies pull additional React type versions, causing mixed JSX type contracts.
- `src/index.tsx` still uses legacy `ReactDOM.render` API.
- `@testing-library/react` is on v12, which targets React `<18`.
- `connected-react-router@6.9.3` only declares peer support for React 16/17.

## Scope

### In scope

1. Align React runtime and type packages to React 18.
2. Migrate app bootstrap to React 18 root API.
3. Upgrade test libraries needed for React 18 compatibility.
4. Keep `connected-react-router` unchanged.
5. Validate with typecheck, lint, tests, build, and smoke checks.

### Out of scope

- Routing architecture migration away from `connected-react-router`.
- Broad refactors unrelated to React 18 upgrade.

## Implementation Steps

### 1) Update dependencies in `package.json`

- Set:
  - `react` -> `^18.x`
  - `react-dom` -> `^18.x`
  - `@types/react` -> `^18.x`
  - `@types/react-dom` -> `^18.x`
- Upgrade test libs:
  - `@testing-library/react` -> React 18-compatible major (14+)
  - `@testing-library/user-event` -> 14+
  - Add/update `@testing-library/dom` to satisfy peer requirements
- Add/adjust `resolutions` to force a single major for:
  - `@types/react`
  - `@types/react-dom`

Expected result: no mixed React type majors in dependency tree.

### 2) Migrate React root API in `src/index.tsx`

- Replace:
  - `import ReactDOM from 'react-dom'`
  - `ReactDOM.render(<App />, document.getElementById('root'))`
- With React 18 API:
  - `import { createRoot } from 'react-dom/client'`
  - root element null guard
  - `createRoot(rootElement).render(<App />)`

### 3) Install and lock

- Run install and update lockfile.
- Verify dependency graph:
  - `yarn why @types/react`
  - `yarn why @types/react-dom`

Acceptance criterion: effective versions are React 18-compatible and not split across incompatible majors.

## Validation Checklist

Run in order:

1. `npx tsc --noEmit`
2. `yarn lint`
3. `yarn test`
4. `yarn build`

Manual smoke checks:

- App boot/load on `/`
- Route transitions (including snippet route)
- Header interactions (run target selector, settings modal)
- Inspector panel and output flow

## Known Risk and Mitigation

### `connected-react-router` peer warning

- Risk: package declares peers for React 16/17 only.
- Decision: keep as-is for this migration.
- Mitigation:
  - Proceed with runtime smoke checks around navigation/state sync.
  - Track follow-up task to migrate routing stack later.

## Success Criteria

- React and React DOM run on v18.
- JSX type mismatch errors tied to `undefined` vs `Element | null` are removed.
- App compiles, builds, and tests pass.
- No functional regression in core navigation and editor workflow.

## Follow-up (separate task)

Evaluate migration path from `connected-react-router` to a React Router v6+ compatible approach.
