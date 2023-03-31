#include "textflag.h"

// func stat(name string, out *inode, cb int)
TEXT ·stat(SB), NOSPLIT, $0
  CallImport
  RET

// func readDir(name string, out []dirEntry, cb int)
TEXT ·readDir(SB), NOSPLIT, $0
  CallImport
  RET

// func readFile(f inode, out []byte, cb int)
TEXT ·readFile(SB), NOSPLIT, $0
  CallImport
  RET

// func writeFile(name string, data []byte, cb int)
TEXT ·writeFile(SB), NOSPLIT, $0
  CallImport
  RET

// func makeDir(name string, cb int)
TEXT ·makeDir(SB), NOSPLIT, $0
  CallImport
  RET
