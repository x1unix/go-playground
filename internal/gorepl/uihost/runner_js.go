package uihost

//go:generate go run ../../../tools/gowasm-gen-import $GOFILE

// onProgramEvalStateChange reports program execution result to UI
//
//gowasm:import
func onProgramEvalStateChange(state EvalState, msg string)
