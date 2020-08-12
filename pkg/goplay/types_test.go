package goplay

import (
	"strconv"
	"testing"

	"github.com/stretchr/testify/require"
)

func TestFmtResponse_HasError(t *testing.T) {
	cases := []struct {
		r   FmtResponse
		err error
	}{
		{
			r:   FmtResponse{},
			err: nil,
		},
		{
			r:   FmtResponse{Error: "foo"},
			err: CompileFailedError{msg: "foo"},
		},
	}
	for i, c := range cases {
		t.Run(strconv.Itoa(i), func(t *testing.T) {
			got := c.r.HasError()
			require.Equal(t, c.err, got)
		})
	}
}

func TestCompileResponse_GetBody(t *testing.T) {
	foo := "foo"
	cases := []struct {
		r    CompileResponse
		want string
	}{
		{
			r:    CompileResponse{},
			want: "",
		},
		{
			r:    CompileResponse{Body: &foo},
			want: foo,
		},
	}
	for i, c := range cases {
		t.Run(strconv.Itoa(i), func(t *testing.T) {
			require.Equal(t, c.want, c.r.GetBody())
		})
	}
}

func TestCompileResponse_HasError(t *testing.T) {
	cases := []struct {
		r   CompileResponse
		err string
	}{
		{
			r:   CompileResponse{},
			err: "",
		},
		{
			r:   CompileResponse{Errors: "foo"},
			err: "foo",
		},
	}
	for i, c := range cases {
		t.Run(strconv.Itoa(i), func(t *testing.T) {
			got := c.r.HasError()
			if c.err == "" {
				require.NoError(t, got)
				return
			}
			require.EqualError(t, got, c.err)
		})
	}
}
