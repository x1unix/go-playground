package uihost

// onProgramEvalStateChange reports program execution result to UI
//
//go:wasmimport gojs github.com/x1unix/go-playground/internal/gorepl/uihost.onProgramEvalStateChange
func onProgramEvalStateChange(state EvalState, msg string)
