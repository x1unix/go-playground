//go:build js

package main

import (
	"errors"
	"fmt"
	"github.com/traefik/yaegi/interp"
	"github.com/traefik/yaegi/stdlib"
	"github.com/x1unix/go-playground/pkg/worker"
	"io/fs"
	"os"
	"strings"
	"syscall/js"
	"time"
)

type fsEntry struct {
	fs *fsObjectWrapper

	name  string
	size  int64
	mode  fs.FileMode
	isDir bool
}

func (f *fsEntry) Stat() (fs.FileInfo, error) {
	return f, nil
}

func (f *fsEntry) Read(bytes []byte) (int, error) {
	return 0, fmt.Errorf("fsEntry.Read: not implemented: %q", f.name)
}

func (f *fsEntry) Close() error {
	return fmt.Errorf("fsEntry.Close: not implemented: %q", f.name)
}

func (f *fsEntry) Name() string {
	return f.name
}

func (f *fsEntry) Size() int64 {
	return f.size
}

func (f *fsEntry) Mode() fs.FileMode {
	return f.mode
}

func (f *fsEntry) ModTime() time.Time {
	return time.Now()
}

func (f *fsEntry) IsDir() bool {
	return f.isDir
}

func (f *fsEntry) Sys() any {
	return nil
}

func (f *fsEntry) UnmarshalValue(value js.Value) error {
	f.name = value.Get("name").String()
	f.size = int64(value.Get("name").Float())
	f.mode = fs.FileMode(value.Get("mode").Float())
	f.isDir = value.Get("isDir").Bool()
	return nil
}

type fsObjectWrapper struct {
	procOpen  js.Value
	procRead  js.Value
	procStat  js.Value
	procClose js.Value
}

func newFsObjectWrapper(hostObj js.Value) *fsObjectWrapper {
	procOpen := hostObj.Get("open")
	procRead := hostObj.Get("read")
	procStat := hostObj.Get("stat")
	procClose := hostObj.Get("close")

	return &fsObjectWrapper{
		procOpen:  procOpen,
		procRead:  procRead,
		procStat:  procStat,
		procClose: procClose,
	}
}

type packageImportHandler struct {
	fsObj *fsObjectWrapper
}

func newPackageImportHandler(fsObj *fsObjectWrapper) packageImportHandler {
	return packageImportHandler{
		fsObj: fsObj,
	}
}

func (h packageImportHandler) Open(name string) (fs.File, error) {
	if strings.HasPrefix(name, "src/vendor") {
		return nil, os.ErrNotExist
	}

	name = strings.TrimPrefix(name, "src/vendor")
	fmt.Printf("mockFS.Open: STUB %q\n", name)
	res, err := worker.Await[fsEntry](h.fsObj.procOpen.Invoke(name))
	if err != nil {
		return nil, err
	}

	res.fs = h.fsObj
	return res, nil
}

type Handler struct {
	packageProvider fs.FS
}

func NewHandler() *Handler {
	return &Handler{}
}

func (h *Handler) registerPackageProvider(this js.Value, args worker.Args) (any, error) {
	if len(args) == 0 {
		return nil, errors.New("missing argument")
	}

	value := args[0]
	if value.Type() != js.TypeObject {
		return nil, fmt.Errorf("argument should be a function, got %s", value)
	}

	h.packageProvider = newPackageImportHandler(newFsObjectWrapper(value))
	return nil, nil
}

func (h *Handler) evalCode(this js.Value, args worker.Args) (interface{}, error) {
	vm := interp.New(interp.Options{
		GoPath:               "",
		SourcecodeFilesystem: h.packageProvider,
	})
	if err := vm.Use(stdlib.Symbols); err != nil {
		return nil, fmt.Errorf("interp.Use returned an error: %s", err)
	}

	var code string
	if err := args.Bind(&code); err != nil {
		return nil, err
	}

	res, err := vm.Eval(code)
	if res.Kind() == 0 || res.IsNil() {
		return nil, err
	}

	return res.Interface(), err
}

func main() {
	h := NewHandler()
	worker.ExportAndStart(worker.Exports{
		"evaluate":                h.evalCode,
		"registerPackageProvider": h.registerPackageProvider,
	})
}
