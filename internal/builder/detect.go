package builder

import (
	"bytes"
	"regexp"
	"strings"

	"github.com/x1unix/go-playground/pkg/goplay"
)

const (
	maxPathDepth = 5
	maxFileCount = 12
)

var (
	benchRegex = regexp.MustCompile(`(?m)\bfunc Benchmark[A-Z]\w+\([\w\d_]+\s\*testing\.B\)`)
	fuzzRegex  = regexp.MustCompile(`(?m)\bfunc Fuzz[A-Z]\w+\([\w\d_]+\s\*testing\.F\)`)
)

type projectType int

const (
	projectTypeProgram projectType = iota
	projectTypeTest
)

type projectInfo struct {
	projectType  projectType
	hasBenchmark bool
	hasFuzz      bool
}

func (p *projectInfo) sum(other projectInfo) {
	if other.projectType == projectTypeProgram {
		return
	}

	p.projectType = other.projectType
	if other.hasBenchmark {
		p.hasBenchmark = true
	}

	if other.hasFuzz {
		p.hasFuzz = true
	}
}

// detectProjectType validates project file extensions and contents.
//
// In result returns project information such as whether this is a regular Go program or test.
func detectProjectType(entries map[string][]byte) (projectInfo, error) {
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
		fileInfo, err := detectGoFileType(name, contents)
		if err != nil {
			return info, err
		}

		if len(bytes.TrimSpace(contents)) == 0 {
			return projectInfo{}, newBuildError("file %s is empty", name)
		}

		info.sum(fileInfo)
	}

	return info, nil
}

func detectGoFileType(fpath string, src []byte) (pInfo projectInfo, err error) {
	pInfo.projectType, err = checkFilePath(fpath)
	if pInfo.projectType == projectTypeProgram || err != nil {
		return pInfo, err
	}

	if fuzzRegex.Match(src) {
		pInfo.hasFuzz = true
	}

	if benchRegex.Match(src) {
		pInfo.hasBenchmark = true
	}

	return pInfo, nil
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
