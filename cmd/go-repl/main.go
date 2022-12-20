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
	"github.com/x1unix/go-playground/internal/gorepl/storage"
	"github.com/x1unix/go-playground/pkg/goproxy"
	"io"
	"net/http"
	"time"
)

func main() {
	now := time.Now().UnixMilli()
	w := storage.JSStorageWriter{}
	w.Create(storage.FileEntry{
		PathName: "/foo/bar.go",
		FileInfo: storage.FileInfo{
			Name:    "bar.go",
			Size:    102400,
			IsDir:   false,
			Mode:    0644,
			ModTime: now,
		},
	})
}

func main2() {
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
		fi := file.FileInfo()
		fi.Mode()
		//fi.ModTime().Unix()
		fmt.Println("* ", file.Name, fi.Name(), fi.Size())
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
