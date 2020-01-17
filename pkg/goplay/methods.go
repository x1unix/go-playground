package goplay

import (
	"context"
	"encoding/json"
	"fmt"
	"go.uber.org/zap"
	"net/url"
)

func GoImports(ctx context.Context, src []byte) (*FmtResponse, error) {
	form := url.Values{}
	form.Add("imports", "true")
	form.Add("body", string(src))

	resp, err := postForm(ctx, "fmt", form)
	if err != nil {
		return nil, fmt.Errorf("failed to contact Go Playground - %s", err)
	}

	dest := &FmtResponse{}
	if err := json.Unmarshal(resp, dest); err != nil {
		zap.S().Errorw("GoImports response is not JSON",
			"err", err,
			"resp", string(resp),
		)
		return nil, fmt.Errorf("failed to decode upstream server response: %s", err)
	}

	return dest, nil
}

func Compile(ctx context.Context, src []byte) (*CompileResponse, error) {
	form := url.Values{}
	form.Add("body", string(src))
	form.Add("version", "2")

	resp, err := postForm(ctx, "compile", form)
	if err != nil {
		return nil, err
	}

	dest := &CompileResponse{}
	if err := json.Unmarshal(resp, dest); err != nil {
		zap.S().Errorw("Compiler response is not JSON",
			"err", err,
			"resp", string(resp),
		)
		return nil, fmt.Errorf("failed to decode upstream server response: %s", err)
	}

	return dest, err
}
