#include "textflag.h"

// func sum2(a, b int) (int, int)
TEXT ·sum2(SB), NOSPLIT, $0
  CallImport
  RET

// func dialByFuncRef(cb, cb2 uint32)
TEXT ·dialByFuncRef(SB), NOSPLIT, $0
  CallImport
  RET

// func readJSFunc(fn js.Func)
TEXT ·readJSFunc(SB), NOSPLIT, $0
  CallImport
  RET

// func testSumArr2(items [2]int) [2]int
TEXT ·testSumArr2(SB), NOSPLIT, $0
  CallImport
  RET
