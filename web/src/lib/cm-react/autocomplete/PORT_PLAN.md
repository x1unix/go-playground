# CodeMirror Autocomplete Port Plan

## Goal

Port hover and completion providers from Monaco-based editor to CodeMirror editor while preserving behavior and worker/data contracts.

## Constraints and Decisions

- Completion and hover source status is emitted by `Editor` via `EventType.CompletionSourceStatus`.
- `CodeEditorContainer` owns worker lifecycle and Redux notifications.
- New provider logic lives in `web/src/lib/cm-react/autocomplete`.
- Source interface should be editor-agnostic and based on `DocumentState` + cursor/offset context.
- Monaco-to-CodeMirror completion conversion is done in the autocomplete source/provider layer, not in `Editor`.
- `Editor` stays generic and consumes normalized CodeMirror-native completion/hover data.
- Documentation rendering remains plain (no markdown rendering work in this step).

## Implementation Plan

1. **Define CM autocomplete source contract**
   - Add abstract interfaces/types for completion + hover requests and responses.
   - Include a cache invalidation API for document/workspace changes.

2. **Build Monaco-to-CodeMirror conversion layer**
   - Map Monaco completion item kinds and snippet rules to CM completion entries.
   - Convert `additionalTextEdits` into CM apply behavior.
   - Keep compatibility with existing worker response schema.

3. **Implement Lezer-based parsing utilities**
   - Replace Monaco token parsing with `@lezer/go` for:
     - import context extraction,
     - symbol/hover query context.
   - Preserve `ImportsContext` semantics used by worker methods.

4. **Implement metadata cache**
   - Per-file import metadata cache keyed by file path.
   - Invalidate on edits intersecting imports range.
   - Full flush on workspace change.

5. **Implement Go completion providers**
   - Imports provider: suggest import paths only inside import clauses.
   - Symbols provider: symbol/literal completion + auto-import edits when needed.
   - Retain snippet fallback behavior.

6. **Implement Go hover provider**
   - Resolve hover query via Lezer-based context.
   - Preserve builtins fast path and worker query shape.

7. **Integrate into `Editor`**
   - Add provider source prop to `EditorProps`.
   - Wire CM completion/hover extensions to source.
   - Reject stale async results when file/path changed.
   - Emit load progress events (`Loading`, `Loaded`, `Error`).

8. **Integrate into `CodeEditorContainer`**
   - Spawn and dispose language worker.
   - Create source implementation and pass to `Editor`.
   - Keep notification mapping in `onEvent` handler.

9. **Workspace invalidation support**
   - Ensure workspace key change clears metadata/source caches alongside buffer cache.

10. **Tests**
    - Port parser tests for imports context using existing fixtures.
    - Port symbol expression parse tests.
    - Add conversion tests for text edits and snippets.

## Progress Log

- [x] Audited old Monaco providers and worker contracts.
- [x] Audited CM editor integration points and event model.
- [x] Confirmed architecture decision for status events (`Editor` emits, container handles Redux).
- [x] Implemented `web/src/lib/cm-react/autocomplete` source interfaces and base utilities.
- [x] Implemented Lezer import parser and metadata cache.
- [x] Implemented completion + hover provider logic.
- [x] Integrated provider source into `Editor` and `CodeEditorContainer`.
- [x] Ported parser tests and ran targeted checks.
- [x] Mixed custom source with editor word completion fallback (`completeAnyWord`).
- [x] Fixed literal query behavior (`os` now resolves package suggestions like Monaco flow).
- [x] Restored auto-import edits for package member completions when package is not imported.
- [x] Added source-level regression tests for `os` literal completion and missing import edit insertion.
- [ ] Add conversion-focused tests for Monaco `additionalTextEdits` + snippet mapping.
