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

// func testI32(a, b, c int32)
TEXT ·testI32(SB), NOSPLIT, $0
  CallImport
  RET

// func testU64(a, b, c uint64)
TEXT ·testU64(SB), NOSPLIT, $0
  CallImport
  RET

// func testI64(a, b, c int64)
TEXT ·testI64(SB), NOSPLIT, $0
  CallImport
  RET

// func testF32(a, b, c float32)
TEXT ·testF32(SB), NOSPLIT, $0
  CallImport
  RET

// func testF64(a, b, c float64)
TEXT ·testF64(SB), NOSPLIT, $0
  CallImport
  RET

// func testBool_U32(b bool, i uint32)
TEXT ·testBool_U32(SB), NOSPLIT, $0
  CallImport
  RET

// func testU8_U32_U8(a uint8, b uint32, c uint8)
TEXT ·testU8_U32_U8(SB), NOSPLIT, $0
  CallImport
  RET

// func testBool_UintPtr2(a bool, b, c uintptr)
TEXT ·testBool_UintPtr2(SB), NOSPLIT, $0
  CallImport
  RET

// func testInt2(a, b int)
TEXT ·testInt2(SB), NOSPLIT, $0
  CallImport
  RET
