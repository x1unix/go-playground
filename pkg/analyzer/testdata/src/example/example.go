// Package example is Go package sample for scanner tests
//
// See: pkg/analyzer/scanner_test.go
package example

// SomeConst is const example
const SomeConst = 32

var (
	// SomeVar is public var example
	SomeVar = "someVar"

	// AnonIfaceVar is var with anonymous interface sample
	AnonIfaceVar interface {
		// Foo does something
		Foo()
	}
)

var privateVar = "privateVar"

// SomeType is public struct example
type SomeType struct{}

// Any is type sample
type Any interface{}

// Action is interface sample
type Action interface {
	// Do is interface method sample
	Do() error
}

// Method is struct method sample
func (st SomeType) Method() {}

// SomeInterface is interface example
type SomeInterface interface{}

// privateType is private type example
type privateType struct {
	foo int
}

// SomeFunc is test function sample
// with doc that contains code sample:
//
//	a := "foo"
//	fmt.PrintLn(a)
//
// end
func SomeFunc(val string) string {
	return "foo" + val
}

// ChanArrFunc is stub
func ChanArrFunc(items ...string) chan string {
	ch := make(chan string, len(items))
	for _, i := range items {
		ch <- i
	}
	return ch
}

// SomeFunc2 is func stub
func SomeFunc2(m map[string]interface{}, v *int) []interface{} {
	return []interface{}{m, v}
}

// IfaceFunc is stub with unterminated code block
//	2 + 2
func IfaceFunc() Action {
	return nil
}

// FuncReturnFuncAndIface is stub
func FuncReturnFuncAndIface() (func() (string, error), interface{ f() }) {
	return nil, nil
}

// XXX is function example
func XXX(a, b string) {

}

// FuncUnnamedParams is function with unnamed params
func FuncUnnamedParams(string) {}
