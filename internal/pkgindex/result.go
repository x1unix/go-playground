package pkgindex

import "github.com/x1unix/go-playground/pkg/monaco"

type GoRootSummary struct {
	Version  string
	Packages []monaco.CompletionItem
}
