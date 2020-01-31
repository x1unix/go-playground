package worker

import (
	"encoding/json"
	"fmt"
)

type Response struct {
	Error  string      `json:"error,omitempty"`
	Result interface{} `json:"result,omitempty"`
}

func (r Response) JSON() string {
	data, err := json.Marshal(r)
	if err != nil {
		// Return manual JSON in case of error
		return fmt.Sprintf(`{"error": %q}`, err)
	}

	return string(data)
}

func NewErrorResponse(err error) Response {
	return Response{Error: err.Error()}
}

func NewResponse(result interface{}, err error) Response {
	if err != nil {
		return Response{Error: err.Error()}
	}

	return Response{Result: result}
}
