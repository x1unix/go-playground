package goplay

import (
	"bytes"
	"context"
	"io"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strconv"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"github.com/x1unix/go-playground/pkg/testutil"
)

func TestValidateContentLength(t *testing.T) {
	cases := map[int]bool{
		maxSnippetSize:      false,
		maxSnippetSize + 10: true,
		10:                  false,
	}
	for i, c := range cases {
		t.Run(strconv.Itoa(i), func(t *testing.T) {
			err := ValidateContentLength(i)
			if !c {
				require.NoError(t, err)
				return
			}
			require.Error(t, err)
		})
	}
}

func TestClient_Compile(t *testing.T) {
	cases := map[string]struct {
		expect     *CompileResponse
		err        string
		payload    []byte
		resp       []byte
		stopServer bool
	}{
		"normal": {
			expect: &CompileResponse{
				Events: []*CompileEvent{
					{Message: "test"},
				},
			},
			resp:    []byte(`{"Events": [{"Message": "test"}]}`),
			payload: []byte("test"),
		},
		"returns error": {
			expect: &CompileResponse{
				Errors: "fff",
			},
			resp:    []byte(`{"Errors": "fff"}`),
			payload: []byte("test"),
		},
		"bad JSON": {
			err:     "failed to unmarshal JSON response",
			resp:    []byte(`}{`),
			payload: []byte("test"),
		},
		"other errors": {
			payload:    []byte("test"),
			err:        "unsupported protocol scheme",
			stopServer: true,
		},
	}
	for n, c := range cases {
		t.Run(n, func(t *testing.T) {
			var client *Client

			if c.stopServer {
				client = NewClient("fubar", "", 0)
			} else {
				var srv *httptest.Server
				srv, client = getTestClientServer(func(w http.ResponseWriter, r *http.Request) {
					assert.Equal(t, http.MethodPost, r.Method)
					assert.Equal(t, "/compile", r.URL.Path, "expected path mismatch")

					body, err := io.ReadAll(r.Body)
					defer r.Body.Close()
					assert.NoError(t, err)
					q, err := url.ParseQuery(string(body))
					require.NoError(t, err)
					require.Equal(t, "2", q.Get("version"))
					require.Equal(t, string(c.payload), q.Get("body"))
					w.WriteHeader(http.StatusOK)
					_, _ = w.Write(c.resp)
				})
				defer srv.Close()
			}

			req := CompileRequest{
				Version: DefaultVersion,
				WithVet: true,
				Body:    c.payload,
			}

			got, err := client.Compile(context.TODO(), req, "")
			if c.err != "" {
				testutil.ContainsError(t, err, c.err)
				return
			}

			require.NoError(t, err)
			require.Equal(t, c.expect, got)
		})
	}
}

func TestClient_GoImports(t *testing.T) {
	cases := map[string]struct {
		expect     *FmtResponse
		err        string
		payload    []byte
		resp       []byte
		stopServer bool
	}{
		"normal": {
			expect: &FmtResponse{
				Body: "fff",
			},
			resp:    []byte(`{"Body": "fff"}`),
			payload: []byte("test"),
		},
		"returns error": {
			expect: &FmtResponse{
				Error: "fff",
			},
			resp:    []byte(`{"Error": "fff"}`),
			payload: []byte("test"),
		},
		"bad JSON": {
			err:     "failed to unmarshal JSON response",
			resp:    []byte(`}{`),
			payload: []byte("test"),
		},
		"other errors": {
			payload:    []byte("test"),
			err:        "unsupported protocol scheme",
			stopServer: true,
		},
	}
	for n, c := range cases {
		t.Run(n, func(t *testing.T) {
			var client *Client

			if c.stopServer {
				client = NewClient("fubar", "", 0)
			} else {
				var srv *httptest.Server
				srv, client = getTestClientServer(func(w http.ResponseWriter, r *http.Request) {
					assert.Equal(t, http.MethodPost, r.Method)
					assert.Equal(t, "/fmt", r.URL.Path, "expected path mismatch")
					w.WriteHeader(http.StatusOK)
					_, _ = w.Write(c.resp)
				})
				defer srv.Close()
			}

			got, err := client.GoImports(context.TODO(), c.payload, BackendGoCurrent)
			if c.err != "" {
				testutil.ContainsError(t, err, c.err)
				return
			}

			require.NoError(t, err)
			require.Equal(t, c.expect, got)
		})
	}
}

func TestClient_Share(t *testing.T) {
	cases := map[string]struct {
		expect     string
		err        string
		payload    []byte
		stopServer bool
	}{
		"normal": {
			expect:  "101",
			payload: []byte("test"),
		},
		"other errors": {
			payload:    []byte("test"),
			err:        "unsupported protocol scheme",
			stopServer: true,
		},
	}
	for n, c := range cases {
		t.Run(n, func(t *testing.T) {
			var client *Client

			if c.stopServer {
				client = NewClient("fubar", "", 0)
			} else {
				var srv *httptest.Server
				srv, client = getTestClientServer(func(w http.ResponseWriter, r *http.Request) {
					assert.Equal(t, "text/plain", r.Header.Get("Content-Type"))
					assert.Equal(t, "/share", r.URL.Path, "expected path mismatch")
					w.WriteHeader(http.StatusOK)
					_, _ = w.Write([]byte(c.expect))
				})
				defer srv.Close()
			}

			got, err := client.Share(context.TODO(), bytes.NewReader(c.payload))
			if c.err != "" {
				testutil.ContainsError(t, err, c.err)
				return
			}

			require.NoError(t, err)
			require.Equal(t, c.expect, got)
		})
	}
}

func TestClient_GetSnippet(t *testing.T) {
	cases := map[string]struct {
		snippetID string
		want      *Snippet
		err       string

		respStatus int
		resp       []byte
	}{
		"get snippet by id": {
			snippetID: "101",
			want: &Snippet{
				FileName: "101.go",
				Contents: "test",
			},
			respStatus: http.StatusOK,
			resp:       []byte("test"),
		},
		"handle not found": {
			snippetID:  "101",
			err:        ErrSnippetNotFound.Error(),
			respStatus: http.StatusNotFound,
			resp:       nil,
		},
		"other error": {
			snippetID:  "101",
			err:        "bad response from playground server: 500 Internal Server Error",
			respStatus: http.StatusInternalServerError,
			resp:       nil,
		},
	}

	for n, c := range cases {
		t.Run(n, func(t *testing.T) {
			srv, client := getTestClientServer(func(w http.ResponseWriter, r *http.Request) {
				wantPath := "/share?id=" + c.snippetID
				assert.Equal(t, wantPath, r.URL.RequestURI(), "expected path mismatch")
				w.WriteHeader(c.respStatus)
				_, _ = w.Write(c.resp)
			})
			defer srv.Close()

			got, err := client.GetSnippet(context.TODO(), c.snippetID)
			if c.err != "" {
				testutil.ContainsError(t, err, c.err)
				return
			}

			require.NoError(t, err)
			require.Equal(t, c.want, got)
		})
	}
}

func getTestClientServer(handler http.HandlerFunc) (*httptest.Server, *Client) {
	srv := httptest.NewServer(handler)
	client := NewClient(srv.URL, "", 5*time.Second)
	return srv, client
}

func someBuff(sizeOf int) []byte {
	b := make([]byte, 0, sizeOf)
	for i := 0; i < sizeOf; i++ {
		b = append(b, 0xf)
	}
	return b
}
