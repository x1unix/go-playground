//go:build js

//
// "go-repl" is a self-contained Go REPL with package downloader to be run in web browser as WASM binary.
//

package main

import (
	"archive/zip"
	"bytes"
	"context"
	"fmt"
	"github.com/x1unix/go-playground/pkg/goproxy"
	"io"
	"net/http"
)

func main() {
	if err := testModDownload(); err != nil {
		fmt.Println("ERR:", err)
	}
}

func testModDownload() error {
	client := goproxy.NewClient(http.DefaultClient, "https://proxy.golang.org")
	v, err := client.GetLatestVersion(context.Background(), "gitlab.com/qosenergy/squalus")
	if err != nil {
		return fmt.Errorf("GetLatestVersion: %w", err)
	}

	src, err := client.GetModuleSource(context.Background(), "gitlab.com/qosenergy/squalus", v.Version)
	if err != nil {
		return fmt.Errorf("GetModuleSource: %w", err)
	}

	reader, err := readBuff(src)
	if err != nil {
		return err
	}

	zf, err := zip.NewReader(reader, reader.Size())
	if err != nil {
		return fmt.Errorf("zip.NewReader: %w", err)
	}
	for _, file := range zf.File {
		fmt.Println("* ", file.Name)
	}

	return nil
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
