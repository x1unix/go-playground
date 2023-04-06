#include "textflag.h"

// func logWrite(level uint8, data []byte)
TEXT ·logWrite(SB), NOSPLIT, $0
  CallImport
  RET
