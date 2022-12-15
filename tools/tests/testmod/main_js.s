#include "textflag.h"

// func sum(a, b int) int
TEXT ·sum(SB), NOSPLIT, $0
  CallImport
  RET

// func sum2(a, b int) (int, int)
TEXT ·sum2(SB), NOSPLIT, $0
  CallImport
  RET

// func dialByFuncRef(cb, cb2 uint32)
TEXT ·dialByFuncRef(SB), NOSPLIT, $0
  CallImport
  RET
