package goproxy

import (
	"net/http"
	"os"
	"strings"
)

func proxyAddressFromEnv() string {
	v, ok := os.LookupEnv("GOPROXY")
	if !ok {
		return DefaultProxyURL
	}

	v = strings.SplitN(v, ",", 2)[0]
	switch v {
	case "", "direct":
		return DefaultProxyURL
	}

	return v
}

// NewClientFromEnv returns a new client with address from GOPROXY environment variable.
//
// Attention: only first address is respected. "direct" value is also ignored.
//
// The default Go proxy URL is returned in case of error.
func NewClientFromEnv() *Client {
	return NewClient(http.DefaultClient, proxyAddressFromEnv())
}
