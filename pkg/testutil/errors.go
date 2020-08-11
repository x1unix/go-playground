package testutil

import (
	"strings"
	"testing"
)

func ContainsError(t *testing.T, err error, msg string) {
	t.Helper()
	if err == nil {
		t.Fatal("expected non nil error")
	}

	if emsg := err.Error(); !strings.Contains(emsg, msg) {
		t.Fatalf("error %q should include %q", emsg, msg)
	}
	return
}
