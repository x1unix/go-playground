package builder

import (
	"bytes"
	"strings"

	"github.com/x1unix/go-playground/pkg/goplay"
)

const (
	maxPathDepth = 5
	maxFileCount = 12
)

func checkFileEntries(entries map[string][]byte) error {
	if len(entries) == 0 {
		return newBuildError("no buildable Go source files")
	}

	if len(entries) > maxFileCount {
		return newBuildError("too many files (max: %d)", maxFileCount)
	}

	for name, contents := range entries {
		if len(bytes.TrimSpace(contents)) == 0 {
			return newBuildError("file %s is empty", name)
		}

		if err := checkFilePath(name); err != nil {
			return err
		}
	}

	return nil
}

func checkFilePath(fpath string) error {
	if err := goplay.ValidateFilePath(fpath, true); err != nil {
		return newBuildError(err.Error())
	}

	pathDepth := strings.Count(fpath, "/")
	if pathDepth > maxPathDepth {
		return newBuildError("file path is too deep: %s", fpath)
	}

	return nil
}
