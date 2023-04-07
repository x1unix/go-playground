import {GoStringType, Int, StackReader, UintPtr} from '~/lib/go';
import {Package, PackageBinding, WasmExport} from '~/lib/gowasm/binder';
import SyscallHelper from '~/lib/gowasm/syscall';
import {FileStore} from './types';
import {Errno, SyscallError} from "~/lib/go/pkg/syscall";

@Package('github.com/x1unix/go-playground/internal/gowasm/browserfs')
export default class BrowserFSBinding extends PackageBinding {
  constructor(private helper: SyscallHelper, private store: FileStore) {
    super();
  }

  // func stat(name string, out *inode, cb int)
  @WasmExport('stat')
  stat(sp: number, reader: StackReader) {
    reader.skipHeader();
    const fileName = reader.next<string>(GoStringType);
    const out = reader.next<number>(UintPtr);
    const cbId = reader.next<number>(Int);

    if (!out || !fileName.length) {
      this.helper.sendErrorResult(cbId, Errno.EINVAL);
      return;
    }

    this.helper.doAsync(cbId, async () => {
      const result = this.store.stat(fileName);

    });
  }

  // func readDir(name string, out []inode, cb int)
  @WasmExport('readDir')
  readDir(sp: number, reader: StackReader) {
    reader.skipHeader();
  }

  // func readFile(f inode, out []byte, cb int)
  @WasmExport('readFile')
  readFile(sp: number, reader: StackReader) {
    reader.skipHeader();
  }

  // func writeFile(name string, data []byte, cb int)
  @WasmExport('writeFile')
  writeFile(sp: number, reader: StackReader) {
    reader.skipHeader();
  }

  // func makeDir(name string, cb int)
  @WasmExport('makeDir')
  makeDir(sp: number, reader: StackReader) {
    reader.skipHeader();
  }

  // func unlink(name string, cb int)
  @WasmExport('unlink')
  unlink(sp: number, reader: StackReader) {
    reader.skipHeader();
  }
}
