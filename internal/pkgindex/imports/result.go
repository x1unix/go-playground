package imports

import "typefox.dev/lsp"

type GoRootSummary struct {
	Version  string               `json:"version"`
	Packages []lsp.CompletionItem `json:"packages"`
}
