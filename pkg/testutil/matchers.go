package testutil

import (
	"os/exec"
	"path/filepath"
	"strings"
)

type CmdMatcher struct {
	cmd []string
}

// MatchCommand returns gomock matcher for exec.Cmd value.
func MatchCommand(args ...string) CmdMatcher {
	return CmdMatcher{
		cmd: args,
	}
}

func (m CmdMatcher) Matches(v any) bool {
	cmd, ok := v.(*exec.Cmd)
	if !ok {
		return false
	}

	if len(cmd.Args) != len(m.cmd) {
		return false
	}

	for i, v := range cmd.Args {
		if i == 0 {
			// exec.Cmd() resolves full binary path before execution.
			// This may break tests.
			v = filepath.Base(v)
		}
		if v != m.cmd[i] {
			return false
		}
	}

	return true
}

func (m CmdMatcher) String() string {
	return strings.Join(m.cmd, " ")
}
