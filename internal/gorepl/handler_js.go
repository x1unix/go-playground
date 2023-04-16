package gorepl

import (
	"context"
	"errors"
	"fmt"
	"sync"
	"sync/atomic"
	"syscall/js"

	"github.com/traefik/yaegi/interp"
	"github.com/x1unix/go-playground/internal/gorepl/uihost"
	"github.com/x1unix/go-playground/internal/gowasm"
	"github.com/x1unix/go-playground/internal/gowasm/wlog"
	"github.com/x1unix/go-playground/pkg/goproxy"
)

// Handler handles requests from WebAssembly host (UI) to eval Go code.
type Handler struct {
	runner *Runner
	client *goproxy.Client

	lock      sync.Mutex
	cancelFn  context.CancelFunc
	isRunning atomic.Bool
}

func NewHandler(c *goproxy.Client, r *Runner) *Handler {
	return &Handler{
		runner: r,
		client: c,
	}
}

// HandleRunProgram handles Go core run command from a client.
//
// Only one evaluation at a time is available.
//
// First argument should be a buffer size.
// Second argument should be an instance of Uint8Array or Uint8ClampedArray.
func (h *Handler) HandleRunProgram(ctx context.Context, args []js.Value) (any, error) {
	if len(args) < 2 {
		return nil, errors.New("missing argument. Buffer size and Uint8Array are required")
	}

	if t := args[0].Type(); t != js.TypeNumber {
		return nil, fmt.Errorf("first argument should be a number, got %q", t)
	}

	strSize := args[0].Int()
	uint8ArrRef := args[1]

	if t := uint8ArrRef.Type(); !uint8ArrRef.Truthy() || t != js.TypeObject {
		return nil, fmt.Errorf("second argument should be Uint8Array, got %q", t)
	}

	h.lock.Lock()
	defer h.lock.Unlock()
	if h.isRunning.Load() {
		return nil, errors.New("another program is already running")
	}

	code := make([]byte, strSize)
	n, err := gowasm.CopyBytesToGo(code, uint8ArrRef)
	if err != nil {
		return nil, err
	}

	if n != strSize {
		wlog.Printf("Warning: expected %d bytes but got %d", strSize, n)
	}

	var programCtx context.Context
	programCtx, h.cancelFn = context.WithCancel(ctx)
	h.isRunning.Store(true)
	go h.runProgram(programCtx, code[:n])

	return nil, nil
}

// HandleTerminateProgram handles program terminate request.
func (h *Handler) HandleTerminateProgram(_ context.Context, _ []js.Value) (any, error) {
	h.lock.Lock()
	defer h.lock.Unlock()

	if !h.isRunning.Load() || h.cancelFn == nil {
		return nil, nil
	}

	h.cancelFn()
	return nil, nil
}

// HandleUpdateGoProxyAddress handles Go proxy URL change requests.
func (h *Handler) HandleUpdateGoProxyAddress(_ context.Context, args []js.Value) (any, error) {
	if len(args) == 0 {
		return nil, errors.New("missing argument")
	}

	if t := args[0].Type(); t != js.TypeString {
		return nil, fmt.Errorf("invalid argument type %q", t)
	}

	newUrl := args[0].String()
	wlog.Println("updated Go module proxy URL:", newUrl)
	h.client.SetBaseURL(newUrl)
	return nil, nil
}

func (h *Handler) runProgram(ctx context.Context, src []byte) {
	defer h.releaseLock()

	uihost.ReportEvalState(uihost.EvalStateBegin)
	err := h.runner.Evaluate(ctx, src)
	if err == nil {
		uihost.ReportEvalState(uihost.EvalStateFinish)
		return
	}

	if errors.Is(err, context.Canceled) {
		uihost.ReportEvalState(uihost.EvalStateFinish)
		return
	}

	if p, ok := err.(interp.Panic); ok {
		uihost.ReportEvalPanic(p.Value, p.Stack)
		return
	}

	uihost.ReportEvalError(err)
}

func (h *Handler) releaseLock() {
	h.lock.Lock()
	defer h.lock.Unlock()
	h.isRunning.Store(false)
	h.cancelFn = nil
}
