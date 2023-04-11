//go:build js

//
// "go-repl" is a self-contained Go REPL with package downloader to be run in web browser as WASM binary.
//

package main

import (
	"github.com/x1unix/go-playground/internal/gorepl"
	"github.com/x1unix/go-playground/internal/gowasm"
	"github.com/x1unix/go-playground/internal/gowasm/browserfs"
	"github.com/x1unix/go-playground/internal/gowasm/packagedb"
	"github.com/x1unix/go-playground/pkg/goproxy"
)

func main() {
	vendorFS := browserfs.NewFS()
	pkgIndex := packagedb.NewPackageIndex()
	client := goproxy.NewClientFromEnv()
	runner := gorepl.NewRunner(vendorFS, pkgIndex, client)

	handler := gorepl.NewHandler(client, runner)
	worker := gowasm.NewWorker()
	worker.Export("RunProgram", handler.HandleRunProgram)
	worker.Export("TerminateProgram", handler.HandleTerminateProgram)
	worker.Export("UpdateGoProxyAddress", handler.HandleUpdateGoProxyAddress)
	worker.Run()
}
