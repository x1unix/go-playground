package builder

import (
	"runtime"
	"strings"
)

var goVersion = strings.TrimPrefix(runtime.Version(), "go")

func generateGoMod(modName string) []byte {
	return []byte("module " + modName + "\ngo " + goVersion)
}
