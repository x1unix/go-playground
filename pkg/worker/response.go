package worker

import (
	"encoding/json"
	"fmt"
)

// Response is worker function call result
type Response struct {
	// Error is error
	Error string `json:"error,omitempty"`

	// Result is execution result
	Result interface{} `json:"result,omitempty"`
}

// JSON returns value as JSON string
func (r Response) JSON() string {
	data, err := json.Marshal(r)
	if err != nil {
		// Return manual JSON in case of error
		return fmt.Sprintf(`{"error": %q}`, err)
	}

	return string(data)
}

// NewErrorResponse returns a new response with error
func NewErrorResponse(err error) Response {
	return Response{Error: err.Error()}
}

// NewResponse is Response constructor
func NewResponse(result interface{}, err error) Response {
	if err != nil {
		return Response{Error: err.Error()}
	}

	return Response{Result: result}
}
