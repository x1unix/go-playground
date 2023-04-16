//go:build !js

package uihost

import "github.com/x1unix/go-playground/internal/gowasm/wlog"

func onProgramEvalStateChange(state EvalState, msg string) {
	wlog.Printf("onProgramEvalStateChange: state=%d msg=%s", state, msg)
}
