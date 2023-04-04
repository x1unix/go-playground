package goimports

import (
	"archive/zip"
	"bytes"
	"context"
	_ "embed"
	"fmt"
	"github.com/stretchr/testify/require"
	"github.com/x1unix/go-playground/pkg/goproxy"
	"go/parser"
	"go/token"
	"io"
	"net/http"
	"testing"
)

//go:embed testdata/sample.go.txt
var sample []byte

func TestSample(t *testing.T) {
	parserMode := parser.Mode(0)
	parserMode |= parser.ImportsOnly
	fset := token.NewFileSet()
	f, err := parser.ParseFile(
		fset, "testdata/sample.go", sample, parserMode)
	require.NoError(t, err)

	t.Log(f)
}

func TestPkgList(t *testing.T) {
	pkg := "github.com/dogenzaka/tsv"
	//pkg := "github.com/DataDog/datadog-go"
	//pkg := "go.uber.org/zap"
	pkgVer := ""
	//pkgVer := "v4.8.3"

	client := goproxy.NewClient(http.DefaultClient, "https://proxy.golang.org")
	if pkgVer == "" {
		v, err := client.GetLatestVersion(context.Background(), pkg)
		require.NoError(t, err, "GetLatestVersion")
		pkgVer = v.Version
		t.Log("Latest version:", v.Version)
	}

	src, err := client.GetModuleSource(context.Background(), pkg, pkgVer)
	require.NoError(t, err, "GetModuleSource")

	reader, err := readBuff(src)
	require.NoError(t, err, "readBuff")

	zf, err := zip.NewReader(reader, reader.Size())
	require.NoError(t, err, "zip.NewReader")
	for _, file := range zf.File {
		fi := file.FileInfo()
		fi.Mode()
		//fi.ModTime().Unix()
		t.Log("* Name:", file.Name, "\nBaseName:", fi.Name(), "\nSize:", fi.Size())
	}
}

func readBuff(src *goproxy.ArchiveReadCloser) (*bytes.Reader, error) {
	buff := bytes.NewBuffer(make([]byte, 0, src.Size))
	defer src.Close()

	if _, err := io.Copy(buff, src); err != nil {
		return nil, fmt.Errorf("io.Copy: %w", err)
	}

	data := buff.Bytes()
	fmt.Printf("Uncompressed: %d bytes\n", len(data))
	fmt.Printf("Header: %x\n", data[0:4])
	return bytes.NewReader(data), nil
}
