package goplay

import (
	"errors"
	"fmt"
	"testing"

	"github.com/stretchr/testify/require"
)

func TestCompileFailedError_Error(t *testing.T) {
	msg := "test"
	err := CompileFailedError{msg: msg}
	require.Equal(t, msg, err.Error())
}

func TestIsCompileError(t *testing.T) {
	errs := []struct {
		err  error
		want bool
	}{
		{
			err:  CompileFailedError{},
			want: true,
		},
		{
			err: errors.New("test"),
		},
		{
			err: ErrSnippetNotFound,
		},
	}

	for _, c := range errs {
		t.Run(fmt.Sprintf("%T", c.err), func(t *testing.T) {
			require.Equal(t, c.want, IsCompileError(c.err))
		})
	}
}
