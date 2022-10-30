package worker

import (
	"errors"
	"fmt"
	"syscall/js"
)

type PromiseResult[T any] struct {
	Value *T
	Error error
}

type PromiseRejectedError struct {
	v js.Value
}

func (err PromiseRejectedError) Error() string {
	return err.v.String()
}

func isFunc(v js.Value) bool {
	return v.Type() == js.TypeFunction
}

//func AwaitCallback[T any]()

func Await[T any](promiseValue js.Value) (*T, error) {
	if promiseValue.Type() != js.TypeObject {
		return nil, fmt.Errorf("passed value should be object, got %s", promiseValue)
	}

	thenFn := promiseValue.Get("then")
	catchFn := promiseValue.Get("catch")

	if !isFunc(thenFn) || !isFunc(catchFn) {
		return nil, errors.New("passed value is not a Promise")
	}

	resultChan := make(chan PromiseResult[T])
	defer close(resultChan)

	go func() {
		thenFn.Invoke(js.FuncOf(func(_ js.Value, args []js.Value) any {
			if len(args) == 0 {
				resultChan <- PromiseResult[T]{}
				return nil
			}

			var v T
			err := BindValue(args[0], &v)
			resultChan <- PromiseResult[T]{Value: &v, Error: fmt.Errorf("BindValue failed: %w", err)}
			return nil
		}))
		catchFn.Invoke("catch", js.FuncOf(func(_ js.Value, args []js.Value) any {
			if len(args) == 0 {
				resultChan <- PromiseResult[T]{Error: errors.New("promise returned an error")}
				return nil
			}

			resultChan <- PromiseResult[T]{Error: PromiseRejectedError{v: args[0]}}
			return nil
		}))
	}()

	result := <-resultChan
	return result.Value, result.Error
}
