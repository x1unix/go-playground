#include "textflag.h"

// func fileCreate(entry *FileEntry) fileTransactionInfo
TEXT ·fileCreate(SB), NOSPLIT, $0
  CallImport
  RET

// func fileWrite(txId uint32, data []byte) int
TEXT ·fileWrite(SB), NOSPLIT, $0
  CallImport
  RET

// func fileCommit(txId uint32, awaitFunc js.Func)
TEXT ·fileCommit(SB), NOSPLIT, $0
  CallImport
  RET

// func fileRollback(txId uint32, awaitFunc js.Func)
//TEXT ·fileRollback(SB), NOSPLIT, $0
//  CallImport
//  RET

