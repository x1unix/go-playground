#include "textflag.h"

// func registerCallbackHandler(fn js.Func)
TEXT ·registerCallbackHandler(SB), NOSPLIT, $0
  CallImport
  RET
