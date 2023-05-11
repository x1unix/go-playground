import {
  Int,
  UintPtr,
  ArrayTypeSpec,
  GoStringType,
  MemoryView,
  SliceHeader,
  SliceHeaderType,
  StackReader,
  stringEncoder,
} from '~/lib/go';
import {Errno, SyscallError} from '~/lib/go/pkg/syscall';
import {Package, PackageBinding, WasmExport} from '../../binder';
import {Inode, MAX_FILE_NAME_LEN, TInode} from "./types";
import SyscallHelper from '../../syscall';
import {FileStore} from './filestore';

const checkFileNameLimit = (strLen: number) => {
  if (!strLen) {
    throw new SyscallError(Errno.EINVAL);
  }

  if (strLen > MAX_FILE_NAME_LEN) {
    throw new SyscallError(Errno.ENAMETOOLONG);
  }
};

const validateFileName = (name: string) => checkFileNameLimit(name.length);

/**
 * WASM imports binding for emulated package cache filesystem.
 *
 * @see internal/gowasm/browserfs/syscall_js.go
 */
@Package('github.com/x1unix/go-playground/internal/gowasm/browserfs')
export class BrowserFSBinding extends PackageBinding {
  constructor(private helper: SyscallHelper, private store: FileStore) {
    super();
  }

  // func stat(name string, out *inode, cb int)
  @WasmExport('stat')
  stat(sp: number, reader: StackReader, mem: MemoryView) {
    reader.skipHeader();
    const fileName = reader.next<string>(GoStringType);
    const outPtr = reader.next<number>(UintPtr);
    const cbId = reader.next<number>(Int);

    if (!cbId) {
      throw new SyscallError(Errno.EBADSLT);
    }

    this.helper.doAsync(cbId, async () => {
      validateFileName(fileName);

      if (!outPtr) {
        throw new SyscallError(Errno.EFAULT);
      }

      const {name, ...result} = await this.store.stat(fileName);
      mem.write<Inode>(outPtr, TInode, {
        ...result,
        name: {
          len: name.length,
          data: stringEncoder.encode(name)
        }
      });
    });
  }

  // func readDir(name string, out *[]inode, cb int)
  @WasmExport('readDir')
  readDir(sp: number, reader: StackReader, mem: MemoryView) {
    reader.skipHeader();
    const dirName = reader.next<string>(GoStringType);
    const outSlicePtr = reader.next<number>(UintPtr);
    const cbId = reader.next<number>(Int);

    if (!cbId) {
      throw new SyscallError(Errno.EBADSLT);
    }

    this.helper.doAsync(cbId, async () => {
      validateFileName(dirName);

      if (!outSlicePtr) {
        throw new SyscallError(Errno.EFAULT);
      }

      const outSlice = mem.read<SliceHeader>(outSlicePtr, SliceHeaderType);
      const items = await this.store.readDir(dirName);
      if (items.length > outSlice.cap) {
        throw new SyscallError(Errno.ENOMEM);
      }

      const inodes = items.map(({name, ...props}) => {
        const encodedName = stringEncoder.encode(name);
        return {
          ...props,
          name: {
            len: encodedName.length,
            data: encodedName,
          }
        };
      });

      // Update slice length
      outSlice.len = items.length;
      mem.write<SliceHeader>(outSlicePtr, SliceHeaderType, outSlice);
      mem.write<Inode[]>(
        outSlice.data,
        new ArrayTypeSpec(TInode, items.length),
        inodes,
      );
    });
  }

  // func readFile(f inode, out *[]byte, cb int)
  @WasmExport('readFile')
  readFile(sp: number, reader: StackReader, mem: MemoryView) {
    reader.skipHeader();
    const fileId = reader.next<number>(UintPtr);
    const slicePtr = reader.next<number>(UintPtr);
    const cbId = reader.next<number>(Int);

    if (!cbId) {
      throw new SyscallError(Errno.EBADSLT);
    }

    this.helper.doAsync(cbId, async () => {
      if (!slicePtr) {
        throw new SyscallError(Errno.EFAULT);
      }

      const data = await this.store.readFile(fileId);

      const dstSlice = mem.read<SliceHeader>(slicePtr, SliceHeaderType);
      if (data.length > dstSlice.cap) {
        throw new SyscallError(Errno.ENOMEM);
      }

      // Update slice length
      dstSlice.len = data.length;
      mem.write<SliceHeader>(slicePtr, SliceHeaderType, dstSlice);
      mem.set(dstSlice.data, data);
    });
  }

  // func writeFile(name string, data []byte, cb int)
  @WasmExport('writeFile')
  writeFile(sp: number, reader: StackReader, mem: MemoryView) {
    reader.skipHeader();
    const fname = reader.next<string>(GoStringType);
    const srcSlice = reader.next<SliceHeader>(SliceHeaderType);
    const cbId = reader.next<number>(Int);

    if (!cbId) {
      throw new SyscallError(Errno.EBADSLT);
    }

    this.helper.doAsync(cbId, async () => {
      validateFileName(fname);
      let data: Uint8Array
      if (srcSlice.len > 0) {
        if (!srcSlice.data) {
          throw new SyscallError(Errno.EFAULT);
        }

        data = mem.get(srcSlice.data, srcSlice.len);
      } else {
        data = new Uint8Array();
      }

      await this.store.writeFile(fname, data);
    });
  }

  // func makeDir(name string, cb int)
  @WasmExport('makeDir')
  makeDir(sp: number, reader: StackReader) {
    reader.skipHeader();
    const fname = reader.next<string>(GoStringType);
    const cbId = reader.next<number>(Int);
    if (!cbId) {
      throw new SyscallError(Errno.EBADSLT);
    }

    this.helper.doAsync(cbId, async () => {
      validateFileName(fname);
      await this.store.makeDir(fname);
    });
  }

  // func unlink(name string, cb int)
  @WasmExport('unlink')
  unlink(sp: number, reader: StackReader) {
    reader.skipHeader();
    const fname = reader.next<string>(GoStringType);
    const cbId = reader.next<number>(Int);
    if (!cbId) {
      throw new SyscallError(Errno.EBADSLT);
    }

    this.helper.doAsync(cbId, async () => {
      validateFileName(fname);
      await this.store.unlink(fname);
    });
  }
}
