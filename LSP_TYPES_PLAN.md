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

- Update `web/src/workers/language/language.worker.ts` version gate to accept index version `2`.

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
