package builder

import (
	"os/exec"
)

//go:generate mockgen -destination=mock_runner.go -package=builder github.com/x1unix/go-playground/internal/builder CommandRunner

// CommandRunner is abstract command cmdRunner.
type CommandRunner interface {
	RunCommand(cmd *exec.Cmd) error
}

type OSCommandRunner struct{}

func (_ OSCommandRunner) RunCommand(cmd *exec.Cmd) error {
	if err := cmd.Start(); err != nil {
		return err
	}

	if err := cmd.Wait(); err != nil {
		return err
	}

	return nil
}
