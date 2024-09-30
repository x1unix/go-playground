package imports

import (
	"bytes"
	"errors"
	"fmt"
	"os"
	"os/exec"
	"strings"
)

// ResolveGoRoot tries to find GOROOT path from environment variables or using "go env" command.
func ResolveGoRoot() (string, error) {
	v, ok := os.LookupEnv("GOROOT")
	if ok {
		return v, nil
	}

	cmd := exec.Command("go", "env", "GOROOT")
	if cmd.Err != nil {
		return "", fmt.Errorf("failed to locate 'go' binary: %w. Is Go installed?", cmd.Err)
	}

	stdout := &bytes.Buffer{}
	stderr := &bytes.Buffer{}
	cmd.Stdout = stdout
	cmd.Stderr = stderr

	err := cmd.Run()
	if err != nil {
		if stderr.Len() > 0 {
			err = fmt.Errorf("%w. Stdout: %s", err, stderr)
		}

		return "", err
	}

	goroot := strings.TrimSpace(stdout.String())
	if goroot == "" {
		return "", errors.New("command 'go env GOROOT' returned an empty result")
	}

	return goroot, nil
}

func IsDirIgnored(basename string, ignoreVendor bool) bool {
	switch basename {
	case "cmd", "internal", "builtin", "testdata":
		return true
	case "vendor":
		return ignoreVendor
	}

	return false
}

func IsVendorDir(dirName string) bool {
	return dirName == "vendor"
}
