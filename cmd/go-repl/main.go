//go:build js

//
// "go-repl" is a self-contained Go REPL with package downloader to be run in web browser as WASM binary.
//

package main

import (
	"context"
	_ "embed"

	"github.com/x1unix/go-playground/internal/gorepl"
	"github.com/x1unix/go-playground/internal/gowasm/browserfs"
	"github.com/x1unix/go-playground/internal/gowasm/packagedb"
	"github.com/x1unix/go-playground/internal/gowasm/wlog"
	"github.com/x1unix/go-playground/pkg/goproxy"
)

//go:embed sample.txt
var sample []byte

func main() {
	vendorFS := browserfs.NewFS()
	pkgIndex := packagedb.NewPackageIndex()
	client := goproxy.NewClientWithDefaults()

	ctx := context.Background()
	worker := gorepl.NewWorker(vendorFS, pkgIndex, client)
	if err := worker.Evaluate(ctx, sample); err != nil {
		wlog.Println("Eval error:", err)
	}
	wlog.Println("Eval ok")
}
