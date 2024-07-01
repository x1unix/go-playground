//go:build js

//
// "go-repl" is a self-contained Go REPL with package downloader to be run in web browser as WASM binary.
// DEPRECATED: Yaegi interpreter is removed in #348.
//

package main

import (
	"github.com/x1unix/go-playground/internal/gorepl"
	"github.com/x1unix/go-playground/internal/gorepl/uihost"
	"github.com/x1unix/go-playground/internal/gowasm"
	"github.com/x1unix/go-playground/internal/gowasm/browserfs"
	"github.com/x1unix/go-playground/internal/gowasm/packagedb"
	"github.com/x1unix/go-playground/pkg/goproxy"
)

func main() {
	// Go memory ballast, 10MiB
	_ = make([]byte, 10<<20)

	worker := gowasm.NewWorker()

	vendorFS := browserfs.NewFS()
	pkgIndex := packagedb.NewPackageIndex()
	client := goproxy.NewClientFromEnv()
	pmObserver := uihost.NewPackageDownloadObserver()
	pmObserver.Start(worker.Context())

	runner := gorepl.NewRunner(vendorFS, pkgIndex, client, pmObserver)
	handler := gorepl.NewHandler(client, runner)
	worker.Export("runProgram", handler.HandleRunProgram)
	worker.Export("terminateProgram", handler.HandleTerminateProgram)
	worker.Export("updateGoProxyAddress", handler.HandleUpdateGoProxyAddress)
	worker.Run()
}
