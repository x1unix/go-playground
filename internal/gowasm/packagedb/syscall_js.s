#include "textflag.h"

// func lookupPackage(pkgName string, out []byte, cb int)
TEXT ·lookupPackage(SB), NOSPLIT, $0
  CallImport
  RET

// func registerPackage(pkgName, version string, cb int)
TEXT ·registerPackage(SB), NOSPLIT, $0
  CallImport
  RET

// func removePackage(okgName string, cb int)
TEXT ·removePackage(SB), NOSPLIT, $0
  CallImport
  RET
