package announcements

import (
	"errors"
	"fmt"
)

// AnnouncementMessagePart represents a part of an announcement message
type MessagePart struct {
	Type  string `json:"type" msgpack:"type"` // "link" or "text"
	Value string `json:"value" msgpack:"value"`
	Label string `json:"label,omitempty" msgpack:"label,omitempty"`
	Style string `json:"style,omitempty" msgpack:"style,omitempty"` // "bold", "italic", or "underline"
}

// AnnouncementMessage represents a complete announcement message
type Announcement struct {
	Key          string        `json:"key" msgpack:"key"`
	Type         string        `json:"type" msgpack:"type"` // "info", "error", "warning", or "success"
	IsIconHidden bool          `json:"isIconHidden,omitempty" msgpack:"isIconHidden,omitempty"`
	IsCentered   bool          `json:"isCentered,omitempty" msgpack:"isCentered,omitempty"`
	Content      []MessagePart `json:"content" msgpack:"content"`
}

func (msg Announcement) Validate() error {
	switch msg.Type {
	case "info", "error", "warning", "success":
		break
	default:
		return fmt.Errorf("invalid announcement message type: %q", msg.Type)
	}

	if len(msg.Content) == 0 {
		return errors.New("missing announcement message content")
	}

	return nil
}
