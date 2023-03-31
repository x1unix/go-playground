#include "textflag.h"

// func requestAtomic() uintptr
TEXT ·requestAtomic(SB), NOSPLIT, $0
  CallImport
  RET

// func waitForEvent(ref uintptr, timeout int32) int32
TEXT ·waitForEvent(SB), NOSPLIT, $0
  CallImport
  RET

// func releaseAtomic(ref uintptr)
TEXT ·releaseAtomic(SB), NOSPLIT, $0
  CallImport
  RET

// func testAtomic(ref uintptr)
TEXT ·testAtomic(SB), NOSPLIT, $0
  CallImport
  RET

