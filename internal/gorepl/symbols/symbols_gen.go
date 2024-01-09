// Package symbols contains additional 'syscall/js' Go symbols for Yaegi which not present by default.
package symbols

import "reflect"

//go:generate go run -exec ./env-wrap.sh github.com/traefik/yaegi/internal/cmd/extract syscall/js

// Symbols variable stores the map of stdlib symbols per package.
var Symbols = map[string]map[string]reflect.Value{}

// MapTypes variable contains a map of functions which have an interface{} as parameter but
// do something special if the parameter implements a given interface.
var MapTypes = map[reflect.Value][]reflect.Type{}
