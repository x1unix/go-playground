package announcements

import (
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"fmt"

	"github.com/vmihailenco/msgpack/v5"
)

type TextMarshaler struct {
	Value *Announcement
}

func (a *TextMarshaler) MarshalText() ([]byte, error) {
	if a.Value == nil {
		return nil, nil
	}

	encoded, err := Encode(a.Value)
	if err != nil {
		return nil, err
	}

	return []byte(encoded), nil
}

func (a *TextMarshaler) UnmarshalText(data []byte) error {
	if len(data) == 0 {
		return nil
	}

	decoded, err := DecodeFromBase64(string(data))
	if err != nil {
		return err
	}

	a.Value = decoded
	return nil
}

// DecodeFromBase64 decodes announcement from base64 string, validates it and returns.
func DecodeFromBase64(payload string) (*Announcement, error) {
	if payload == "" {
		return nil, nil
	}

	rawMsg, err := base64.StdEncoding.DecodeString(payload)
	if err != nil {
		return nil, fmt.Errorf("can't decode announcement from base64: %w", err)
	}

	msg := &Announcement{}
	if err := msgpack.Unmarshal(rawMsg, msg); err != nil {
		return nil, fmt.Errorf("can't decode announcenment from msgpack: %w", err)
	}

	if err := msg.Validate(); err != nil {
		return nil, fmt.Errorf("invalid announcement contents: %w", err)
	}

	if msg.Key == "" {
		// auto-compute announcement key
		hash := sha256.Sum256(rawMsg)
		msg.Key = hex.EncodeToString(hash[:])
	}

	return msg, nil
}

// Encode encodes announcement message into a msgpack base64 string.
func Encode(msg *Announcement) (string, error) {
	data, err := msgpack.Marshal(msg)
	if err != nil {
		return "", fmt.Errorf("can't encode message to msgpack: %w", err)
	}

	return base64.StdEncoding.EncodeToString(data), nil
}
