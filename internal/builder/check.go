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

type projectType int

const (
	projectTypeProgram projectType = iota
	projectTypeTest
)

type projectInfo struct {
	projectType projectType
}

// checkFileEntries validates project file extensions and contents.
//
// In result returns project information such as whether this is a regular Go program or test.
func checkFileEntries(entries map[string][]byte) (projectInfo, error) {
	if len(entries) == 0 {
		return projectInfo{}, newBuildError("no buildable Go source files")
	}

	if len(entries) > maxFileCount {
		return projectInfo{}, newBuildError("too many files (max: %d)", maxFileCount)
	}

	info := projectInfo{
		projectType: projectTypeProgram,
	}

	for name, contents := range entries {
		projType, err := checkFilePath(name)
		if err != nil {
			return info, err
		}

		if len(bytes.TrimSpace(contents)) == 0 {
			return projectInfo{}, newBuildError("file %s is empty", name)
		}

		if projType == projectTypeTest {
			info.projectType = projType
		}
	}

	return info, nil
}

// checkFilePath check if file extension and path are correct.
//
// Also, if file is located at root, returns its Go file type - test or regular file.
func checkFilePath(fpath string) (projectType, error) {
	projType := projectTypeProgram
	if err := goplay.ValidateFilePath(fpath, true); err != nil {
		return projType, newBuildError(err.Error())
	}

	pathDepth := strings.Count(fpath, "/")
	if pathDepth > maxPathDepth {
		return projType, newBuildError("file path is too deep: %s", fpath)
	}

	isRoot := false
	switch pathDepth {
	case 0:
		isRoot = true
	case 1:
		// Path might be root but start with slash
		isRoot = strings.HasPrefix(fpath, "/")
	}

	if isRoot && strings.HasSuffix(fpath, "_test.go") {
		projType = projectTypeTest
	}

	return projType, nil
}
