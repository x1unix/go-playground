package pacman

import (
	"path"
	"strings"
)

var (
	ignoredPaths = []string{
		"/testdata/",
		".github",
	}

	ignoredSuffixes = []string{
		"_test.go",
		".md",
	}

	ignoredNames = []string{
		"README",
		"LICENSE",
		"Makefile",
	}
)

// shouldSkipFile checks if file should be discarded
func shouldSkipFile(filename string) bool {
	for _, segment := range ignoredPaths {
		if strings.Contains(filename, segment) {
			return true
		}
	}

	for _, segment := range ignoredSuffixes {
		if strings.HasSuffix(filename, segment) {
			return true
		}
	}

	baseName := path.Base(filename)
	if baseName[0] == '.' {
		// Skip hidden files
		return true
	}

	for _, segment := range ignoredNames {
		if strings.HasPrefix(baseName, segment) {
			return true
		}
	}

	return false
}
