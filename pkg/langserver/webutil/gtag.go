package webutil

import (
	"errors"
	"regexp"
)

var gtagRegExp = regexp.MustCompile(`(?i)^[A-Z]{2}-[A-Z0-9\-\+]+$`)

// ValidateGTag validates Google Analytics tag ID
func ValidateGTag(gtag string) error {
	if !gtagRegExp.MatchString(gtag) {
		return errors.New("invalid GTag ID value")
	}
	return nil
}
