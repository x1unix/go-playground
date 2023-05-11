package gowasm

import (
	"context"
	"fmt"
	"syscall/js"

	"github.com/samber/lo"
	"github.com/x1unix/go-playground/internal/gowasm/wlog"
)

type Func func(ctx context.Context, args []js.Value) (any, error)

type Worker struct {
	ctx        context.Context
	cancelFunc context.CancelFunc
	exports    map[string]Func
}

// NewWorker constructs a new worker object.
func NewWorker() *Worker {
	ctx, cancelFunc := context.WithCancel(context.Background())
	return &Worker{
		ctx:        ctx,
		cancelFunc: cancelFunc,
		exports: map[string]Func{
			"exit": func(_ context.Context, _ []js.Value) (any, error) {
				cancelFunc()
				return nil, nil
			},
		},
	}
}

// Context returns worker execution context
func (w *Worker) Context() context.Context {
	return w.ctx
}

// Export adds a new callback to worker export object
func (w *Worker) Export(methodName string, cb Func) {
	w.exports[methodName] = cb
}

type jsFunc struct {
	ref   uint64
	grPtr uintptr
	id    uint32
}

// Run registers worker and starts program execution.
//
// This method blocks the main goroutine until worker context is alive.
func (w *Worker) Run() {
	methods := lo.Keys(w.exports)
	handlerFunc := js.FuncOf(w.handleCall)
	wlog.Debug("Registering worker entrypoint...")
	go registerWorkerEntrypoint(methods, handlerFunc)

	wlog.Debug("Worker started")
	<-w.ctx.Done()
	wlog.Debug("Worker stopped")
}

// handleCall handles calls from JS and routes them to handlers.
func (w *Worker) handleCall(_ js.Value, args []js.Value) any {
	if len(args) == 0 {
		panic("gowasm.Worker: method name is required")
	}

	methodName := args[0].String()
	wlog.Debugf("received call: %s", methodName)

	handler, ok := w.exports[methodName]
	if !ok {
		panic(fmt.Sprintf("gowasm.Worker: method not found - %s", methodName))
	}

	result, err := handler(w.ctx, args[1:])
	if err != nil {
		panic(fmt.Sprintf("Worker.%s: %s", methodName, err))
	}

	return result
}
