package gorepl

import (
	"context"
	"github.com/x1unix/go-playground/internal/gorepl/pacman"
	"github.com/x1unix/go-playground/internal/gorepl/storage"
	"github.com/x1unix/go-playground/pkg/goproxy"
)

type Worker struct {
	pkgCache storage.ReadWriteFS
	pkgMgr   *pacman.PackageManager
}

func NewWorker(pkgCache storage.ReadWriteFS, client *goproxy.Client) *Worker {
	return &Worker{
		pkgCache: pkgCache,
		pkgMgr:   pacman.NewPackageManager(client, nil),
	}
}

func (w *Worker) Evaluate(code []byte) error {
	return nil
}

func (w *Worker) checkNewImports(ctx context.Context, code []byte) error {
	rootImports, err := pacman.ParseFileImports("main.go", "", code)
	if err != nil {
		return err
	}

	return w.pkgMgr.CheckDependencies(ctx, rootImports)
}
