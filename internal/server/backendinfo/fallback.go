package backendinfo

import (
	"strconv"
	"strings"
)

func prefillFallbacks(info *BackendVersions) {
	if info.PreviousStable == "" {
		info.PreviousStable = guessPreviousVersion(info.CurrentStable)
	}

	if info.Nightly == "" {
		info.Nightly = "devel"
	}
}

func guessPreviousVersion(baseVer string) string {
	chunks := strings.Split(baseVer, ".")
	if len(chunks) < 2 {
		return baseVer
	}

	minorVer, err := strconv.Atoi(chunks[1])
	if err != nil {
		return baseVer
	}

	minorVer = max(0, minorVer-1)
	return chunks[0] + "." + strconv.Itoa(minorVer) + ".0"
}

