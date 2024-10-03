package imports

import "github.com/x1unix/go-playground/pkg/monaco"

type GoRootSummary struct {
	Version  string                  `json:"version"`
	Packages []monaco.CompletionItem `json:"packages"`
}
