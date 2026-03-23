# LSP Types Migration Plan

## pkgindexer

### Go code changes (pkg indexer)

- Replace Monaco completion-related types with LSP types (`typefox.dev/lsp`) across `internal/pkgindex`.
  - `internal/pkgindex/docutil/types.go`
    - `monaco.CompletionItemKind` -> `lsp.CompletionItemKind`
    - `monaco.CompletionItemInsertTextRule` -> `lsp.InsertTextFormat`
  - `internal/pkgindex/docutil/utils.go`
    - token-to-kind map switches from Monaco constants to LSP constants.
  - `internal/pkgindex/docutil/type.go`
    - `BlockData.Kind` and symbol kind assignments use LSP completion kinds.
  - `internal/pkgindex/docutil/func.go`
    - function signature accepts `lsp.InsertTextFormat`.
    - snippet detection uses LSP snippet format constant.
  - `internal/pkgindex/docutil/traverse.go`
    - `TraverseOpts.SnippetFormat` uses LSP insert text format.
    - symbol creation uses LSP snippet format.

- Update index model types to LSP enums.
  - `internal/pkgindex/index/types.go`
    - `Symbols.InsertTextRules []lsp.InsertTextFormat`
    - `Symbols.Kinds []lsp.CompletionItemKind`
    - `NewSymbols` preallocations updated for LSP typed slices.

- Update parsing pipeline to pass LSP snippet format.
  - `internal/pkgindex/index/parse.go`
    - `TraverseOpts.SnippetFormat` uses LSP snippet constant.

- Update imports scanner/parser output types from Monaco completion items to LSP completion items.
  - `internal/pkgindex/imports/parser.go`
    - return type switches to `lsp.CompletionItem`.
    - kind constants switch to LSP (`lsp.ModuleCompletion`).
    - documentation is set using LSP union type (`Or_CompletionItem_documentation`) with `MarkupContent` (`kind: markdown`).
  - `internal/pkgindex/imports/result.go`
    - `GoRootSummary.Packages []lsp.CompletionItem`.
  - `internal/pkgindex/imports/scanner.go`
    - intermediate/result slices use `lsp.CompletionItem`.

- Bump index schema version.
  - `internal/pkgindex/index/types.go`
    - `GoIndexFileVersion` from `1` to `2`.

- Update tests and fixtures for LSP enum values.
  - `internal/pkgindex/docutil/traverse_test.go`
  - `internal/pkgindex/imports/parser_test.go`
  - `internal/pkgindex/docutil/testdata/simple/expect.json`
  - `internal/pkgindex/docutil/testdata/builtin/expect.json`
  - `internal/pkgindex/docutil/testdata/bufio/expect.json`

- Verify with:
  - `go test ./internal/pkgindex/...`
  - `go test ./tools/pkgindexer/...`

### TypeScript changes (follow-up)

- Migrate language worker contracts from Monaco types to LSP types from `vscode-languageserver-protocol`.
  - `web/src/workers/language/language.worker.ts`
    - update index version gate to accept `2`.
    - return LSP types from worker methods (`CompletionItem[]`, `Hover`).
    - bump completion cache key namespace (e.g. `completionItems.v2`) to invalidate old Monaco-shaped cache entries.
  - `web/src/workers/language/types/response.ts`
    - replace Monaco enum types with LSP enum types for `symbols.kinds` and `symbols.insertTextRules`.
  - `web/src/workers/language/types/suggestion.ts`
    - replace `monaco.IRange` with LSP `Range` in worker request context (`SuggestionContext` / `ImportsContext`).
  - `web/src/workers/language/utils.ts`
    - replace Monaco completion/doc builders with LSP equivalents (`CompletionItemKind`, `InsertTextFormat`, `MarkupContent`, `TextEdit[]`).
    - move extra package metadata to `CompletionItem.data` (instead of custom completion fields).

- Migrate cm-react autocomplete API contract from Monaco copy-pasta types to LSP types.
  - `web/src/lib/cm-react/types/autocomplete.ts`
    - remove Monaco-derived completion/markdown types.
    - use LSP completion/hover types in the contract, while keeping CM-specific offset fields (`replaceFrom`/`replaceTo`).
    - keep completion CSS-icon string mapping out of API contract.
  - `web/src/lib/cm-react/autocomplete/converter.ts`
    - convert LSP completion and hover payloads to CM internal structures.
    - snippet detection must use `insertTextFormat === InsertTextFormat.Snippet`.
    - map LSP kinds to CM completion `type` string in plugin layer.
    - convert LSP 0-based ranges/text edits into document offsets.
  - `web/src/lib/cm-react/autocomplete/go-source.ts`
    - use LSP types for worker responses.
    - read package metadata from `CompletionItem.data`.
  - `web/src/lib/cm-react/autocomplete/snippets.ts`
    - replace Monaco numeric constants with LSP enums.

- Update storage-layer autocomplete record types consumed by language worker cache.
  - `web/src/services/storage/types/completion.ts`
    - replace Monaco-based completion item shape with LSP-based fields.
    - update documentation type to LSP-compatible markdown payload.

- Update additional frontend area that consumes shared language worker contract (legacy Monaco editor path).
  - `web/src/components/features/workspace/CodeEditor/autocomplete/base.ts`
  - `web/src/components/features/workspace/CodeEditor/autocomplete/imports/provider.ts`
  - `web/src/components/features/workspace/CodeEditor/autocomplete/symbols/provider.ts`
  - `web/src/components/features/workspace/CodeEditor/autocomplete/hover/provider.ts`
  - `web/src/components/features/workspace/CodeEditor/autocomplete/parser/imports.ts`
  - `web/src/components/features/workspace/CodeEditor/autocomplete/symbols/snippets.ts`
  - either adapt these providers at the boundary to convert LSP worker payloads to Monaco completion/hover types, or migrate this path to LSP-shaped internal contracts.

- Update tests for new contracts and enum semantics.
  - `web/src/lib/cm-react/autocomplete/converter.test.ts`
  - `web/src/lib/cm-react/autocomplete/go-source.test.ts`
  - `web/src/lib/cm-react/autocomplete/imports.test.ts`
  - `web/src/components/features/workspace/CodeEditor/autocomplete/parser/imports.test.ts`

## analyzer

### Go code changes (analyzer)

- Replace Monaco marker types with LSP diagnostic types in analyzer package.
  - `internal/analyzer/check/marker.go`
    - `[]monaco.MarkerData` -> `[]lsp.Diagnostic`.
    - `monaco.Error` severity -> `lsp.SeverityError`.
    - line/column mapping -> LSP `Range` (`Position` is 0-based).
    - `Result.Markers` type should use `[]lsp.Diagnostic`.
- Confirm analyzer wasm worker JSON contract still matches updated payload shape.
  - `cmd/wasm/analyzer/webworker.go`
- Verify with:
  - `go test ./internal/analyzer/...`

### TypeScript changes (follow-up)

- TODO: update analyzer worker/client types to consume LSP diagnostics and map them to Monaco markers where needed.
  - `web/src/workers/analyzer/types.ts`
  - `web/src/workers/analyzer/bootstrap.ts`
  - `web/src/workers/analyzer/analyzer.worker.ts`
