#include "textflag.h"

// func multiply(a, b int) int
TEXT ·multiply(SB), NOSPLIT, $0
  CallImport
  RET

// func dialByFuncRef(cb, cb2 uint32)
TEXT ·dialByFuncRef(SB), NOSPLIT, $0
  CallImport
  RET

// func testBool(a, b, c bool)
TEXT ·testBool(SB), NOSPLIT, $0
  CallImport
  RET

// func testU8(a, b, c byte)
TEXT ·testU8(SB), NOSPLIT, $0
  CallImport
  RET

// func testU32(a, b, c uint32)
TEXT ·testU32(SB), NOSPLIT, $0
  CallImport
  RET
