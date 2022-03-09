package compiler

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"os"
	"os/exec"
	"strings"
	"time"
)

const goRootEnv = "GOROOT"

// ErrUndefinedEnvVariable occurs when requested environment variable is undefined or empty
var ErrUndefinedEnvVariable = errors.New("environment variable is undefined or empty")

// GOROOT returns host GOROOT variable from OS environment vars or from Go tool environment.
func GOROOT() (string, error) {
	return LookupEnv(context.Background(), goRootEnv)
}

func newGoToolCommand(ctx context.Context, args ...string) *exec.Cmd {
	cmd := exec.CommandContext(ctx, "go", args...)
	cmd.Env = os.Environ()
	return cmd
}

func getEnvFromGo(ctx context.Context, envName string) (string, error) {
	cmd := newGoToolCommand(ctx, "env", envName)
	buff := new(bytes.Buffer)
	cmd.Stdout = buff
	if err := cmd.Run(); err != nil {
		return "", fmt.Errorf("command %q returned an error: %w", strings.Join(cmd.Args, " "), err)
	}

	return buff.String(), nil
}

// LookupEnv gets variable by name from shell environment or using Go environment using "go env" tool.
func LookupEnv(ctx context.Context, varName string) (string, error) {
	envVar, ok := os.LookupEnv(varName)
	if ok {
		envVar = strings.TrimSpace(envVar)
		if envVar != "" {
			return envVar, nil
		}
	}

	cmdCtx, cf := context.WithTimeout(ctx, 5*time.Second)
	defer cf()

	// Lookup env variable using "go env" tool if not defined in environment.
	val, err := getEnvFromGo(cmdCtx, varName)
	if err != nil {
		return "", err
	}

	val = strings.TrimSpace(val)
	if val == "" {
		return "", ErrUndefinedEnvVariable
	}

	return val, nil
}
