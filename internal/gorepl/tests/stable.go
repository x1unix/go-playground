package tests

import (
	"context"
	"github.com/x1unix/go-playground/internal/gorepl"
	"github.com/x1unix/go-playground/internal/gowasm/browserfs"
	"github.com/x1unix/go-playground/internal/gowasm/packagedb"
	"github.com/x1unix/go-playground/internal/gowasm/wlog"
	"github.com/x1unix/go-playground/pkg/goproxy"
)

func TestStable() {
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
