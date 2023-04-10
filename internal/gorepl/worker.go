package gorepl

import (
	"context"
	"fmt"
	"io/fs"
	"os"
	"path"

	"github.com/traefik/yaegi/interp"
	"github.com/traefik/yaegi/stdlib"
	"github.com/x1unix/go-playground/internal/gorepl/pacman"
	"github.com/x1unix/go-playground/internal/gowasm"
	"github.com/x1unix/go-playground/pkg/goproxy"
)

type ReadWriteFS interface {
	fs.ReadDirFS
	pacman.WritableFS
}

type Worker struct {
	vendorFs ReadWriteFS
	goPath   string
	pkgMgr   *pacman.PackageManager
}

func NewWorker(vendorFs ReadWriteFS, pkgIndex pacman.PackageIndex, client *goproxy.Client) *Worker {
	goPath := getGoPath()
	cache := pacman.NewSimpleFSCache(
		path.Join(goPath, "src/vendor"),
		vendorFs,
		pkgIndex,
	)

	return &Worker{
		vendorFs: vendorFs,
		goPath:   goPath,
		pkgMgr:   pacman.NewPackageManager(client, cache),
	}
}

func (w *Worker) Evaluate(ctx context.Context, code []byte) error {
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
		return fmt.Errorf("failed to load Go runtime: %w", err)
	}

	prog, err := vm.Compile(string(code))
	if err != nil {
		return fmt.Errorf("go build failed: %w", err)
	}

	res, err := vm.ExecuteWithContext(ctx, prog)
	if err != nil {
		return err
	}

	if res.Kind() == 0 || res.IsNil() {
		return err
	}

	return nil
}

func (w *Worker) checkNewImports(ctx context.Context, code []byte) error {
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
