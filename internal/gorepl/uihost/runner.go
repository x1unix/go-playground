package uihost

import "fmt"

// EvalState is current Go program evaluation state.
type EvalState uint8

const (
	EvalStateZero EvalState = iota
	EvalStateBegin
	EvalStateFinish
	EvalStateError
	EvalStatePanic
)

// ReportEvalPanic reports Go panic during evaluation
func ReportEvalPanic(value any, stack []byte) {
	onProgramEvalStateChange(EvalStatePanic, fmt.Sprintf("panic: %s\n%s",
		value, stack,
	))
}

// ReportEvalError reports program eval error.
func ReportEvalError(err error) {
	if err == nil {
		ReportEvalState(EvalStateError)
		return
	}

	onProgramEvalStateChange(EvalStateError, err.Error())
}

// ReportEvalState reports program evaluation state change.
//
// Used to notify about program execution start or end.
func ReportEvalState(state EvalState) {
	onProgramEvalStateChange(state, "")
}
