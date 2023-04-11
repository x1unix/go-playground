//go:build !js

package uihost

import "github.com/x1unix/go-playground/internal/gowasm/wlog"

func onPackageManagerEvent(e packageManagerEvent) {
	wlog.Printf("onPackageManagerEvent: %#v\n", e)
}
