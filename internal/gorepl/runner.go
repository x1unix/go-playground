package gorepl

import (
	"context"
	"io/fs"
	"os"
	"path"

	"github.com/traefik/yaegi/interp"
	"github.com/traefik/yaegi/stdlib"
	"github.com/x1unix/go-playground/internal/gorepl/pacman"
	"github.com/x1unix/go-playground/internal/gorepl/uihost"
	"github.com/x1unix/go-playground/internal/gowasm"
	"github.com/x1unix/go-playground/pkg/goproxy"
)

type ReadWriteFS interface {
	fs.ReadDirFS
	pacman.WritableFS
}

type Runner struct {
	vendorFs   ReadWriteFS
	goPath     string
	pkgMgr     *pacman.PackageManager
	pmObserver *uihost.PackageDownloadObserver
}

func NewRunner(vendorFs ReadWriteFS, pkgIndex pacman.PackageIndex, client *goproxy.Client) *Runner {
	goPath := getGoPath()
	cache := pacman.NewSimpleFSCache(
		path.Join(goPath, "src/vendor"),
		vendorFs,
		pkgIndex,
	)

	pmObserver := uihost.NewPackageDownloadObserver()
	pkgMgr := pacman.NewPackageManager(client, cache)
	pkgMgr.SetProgressObserver(pmObserver)

	return &Runner{
		vendorFs:   vendorFs,
		goPath:     goPath,
		pkgMgr:     pkgMgr,
		pmObserver: pmObserver,
	}
}

func (w *Runner) Evaluate(ctx context.Context, code []byte) error {
	if err := w.checkNewImports(ctx, code); err != nil {
		return err
	}

	vm := interp.New(interp.Options{
		Stderr:               gowasm.Stderr,
		Stdout:               gowasm.Stdout,
		GoPath:               w.goPath,
		SourcecodeFilesystem: w.vendorFs,
	})
	if err := vm.Use(stdlib.Symbols); err != nil {
		return newBuildError(err, "failed to load Go runtime")
	}

	prog, err := vm.Compile(string(code))
	if err != nil {
		return newBuildError(err, "")
	}

	_, err = vm.ExecuteWithContext(ctx, prog)
	if err != nil {
		return err
	}

	return nil
}

func (w *Runner) checkNewImports(ctx context.Context, code []byte) error {
	rootImports, err := pacman.ParseFileImports("main.go", "", code)
	if err != nil {
		return err
	}

	return w.pkgMgr.CheckDependencies(ctx, rootImports)
}

func getGoPath() string {
	goPath, ok := os.LookupEnv("GOPATH")
	if !ok {
		return "/go"
	}
	return goPath
}
