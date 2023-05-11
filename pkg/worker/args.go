//go:build js
// +build js

package worker

import (
	"fmt"
	"syscall/js"
)

// NewTypeError creates a new type error
func NewTypeError(expType, gotType js.Type) error {
	return fmt.Errorf("value type should be %q, but got %q", expType, gotType)
}

// ValueUnmarshaler unmarshal JS value
type ValueUnmarshaler interface {
	// UnmarshalValue unmarshal JS value
	UnmarshalValue(js.Value) error
}

// Args is collection if function call arguments
type Args []js.Value

// BindIndex binds argument at specified index to passed value
func (args Args) BindIndex(index int, dest interface{}) error {
	if len(args) <= index {
		return fmt.Errorf("function expects %d arguments, but %d were passed", index+1, len(args))
	}

	return BindValue(args[index], dest)
}

// Bind binds passed JS arguments to Go values
//
// Function supports *int, *bool, *string and ValueUnmarshaler values.
func (args Args) Bind(targets ...interface{}) error {
	if len(args) != len(targets) {
		return fmt.Errorf("function expects %d arguments, but %d were passed", len(targets), len(args))
	}

	for i, arg := range args {
		if err := BindValue(arg, targets[i]); err != nil {
			return fmt.Errorf("invalid argument %d type: %w", i, err)
		}
	}

	return nil
}

// BindValue binds JS value to specified target
func BindValue(val js.Value, dest interface{}) error {
	valType := val.Type()
	switch v := dest.(type) {
	case *int:
		if valType != js.TypeNumber {
			return NewTypeError(js.TypeNumber, valType)
		}

		*v = val.Int()
	case *bool:
		if valType != js.TypeBoolean {
			return NewTypeError(js.TypeBoolean, valType)
		}

		*v = val.Bool()
	case *string:
		if valType != js.TypeString {
			return NewTypeError(js.TypeString, valType)
		}

		*v = val.String()
	case ValueUnmarshaler:
		return v.UnmarshalValue(val)
	default:
		return fmt.Errorf("BindValue: unsupported JS type %q (%d)", valType.String(), valType)
	}

	return nil
}
