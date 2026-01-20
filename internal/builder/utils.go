package builder

import (
	"regexp"
	"runtime"
)

var (
	goVersion      string
	goVersionRegEx = regexp.MustCompile(`(?m)^go (\d+\.\d+\.\d+){1}`)
)

func init() {
	goVersion = parseGoVersion(runtime.Version())
	if goVersion == "" {
		goVersion = "1.25"
	}
}

func parseGoVersion(input string) string {
	matches := goVersionRegEx.FindStringSubmatch(input)
	if len(matches) > 1 {
		return matches[1]
	}
	return ""
}

func generateGoMod(modName string) []byte {
	return []byte("module " + modName + "\ngo " + goVersion)
}
