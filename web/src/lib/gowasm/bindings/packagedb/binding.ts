import { Package, PackageBinding, WasmExport } from '../../binder'
import type SyscallHelper from '../../syscall'
import { type PackageIndex } from './pkgindex'
import { Errno, SyscallError } from '~/lib/go/pkg/syscall'
import {
  GoStringType,
  Int,
  type MemoryView,
  type SliceHeader,
  SliceHeaderType,
  type StackReader,
  stringEncoder,
  UintPtr,
} from '~/lib/go'

/**
 * @see internal/gowasm/packagedb/index.go
 */
const MAX_PACKAGE_VERSION_LENGTH = 50

const checkVersionStringLimit = (version: string) => {
  if (!version.length) {
    throw new SyscallError(Errno.EINVAL)
  }

  if (version.length > MAX_PACKAGE_VERSION_LENGTH) {
    throw new SyscallError(Errno.ENAMETOOLONG)
  }
}

/**
 * WASM imports binding to Go packages registry.
 *
 * @see internal/gowasm/packagedb/syscall_js.go
 */
@Package('github.com/x1unix/go-playground/internal/gowasm/packagedb')
export class PackageDBBinding extends PackageBinding {
  constructor(
    private readonly helper: SyscallHelper,
    private readonly index: PackageIndex,
  ) {
    super()
  }

  // func lookupPackage(pkgName string, out *[]byte, cb int)
  @WasmExport('lookupPackage')
  lookupPackage(sp: number, stack: StackReader, mem: MemoryView) {
    stack.skipHeader()
    const pkgName = stack.next<string>(GoStringType)
    const outPtr = stack.next<number>(UintPtr)
    const cbId = stack.next<number>(Int)
    if (!cbId) {
      throw new SyscallError(Errno.EBADSLT)
    }

    this.helper.doAsync(cbId, async () => {
      if (!outPtr) {
        throw new SyscallError(Errno.EFAULT)
      }

      const dstSlice = mem.read<SliceHeader>(outPtr, SliceHeaderType)
      const version = await this.index.lookupPackage(pkgName)
      if (!version) {
        throw new SyscallError(Errno.ENOENT)
      }

      if (dstSlice.cap < version.length) {
        throw new SyscallError(Errno.ENOMEM)
      }

      if (!dstSlice.data) {
        throw new SyscallError(Errno.EFAULT)
      }

      const versionBytes = stringEncoder.encode(version)

      // Update slice length
      dstSlice.len = versionBytes.length
      mem.write<SliceHeader>(outPtr, SliceHeaderType, dstSlice)
      mem.set(dstSlice.data, versionBytes)
    })
  }

  // func registerPackage(pkgName, version string, cb int)
  @WasmExport('registerPackage')
  registerPackage(sp: number, stack: StackReader, mem: MemoryView) {
    stack.skipHeader()
    const pkgName = stack.next<string>(GoStringType)
    const version = stack.next<string>(GoStringType)
    const cbId = stack.next<number>(Int)
    if (!cbId) {
      throw new SyscallError(Errno.EBADSLT)
    }

    this.helper.doAsync(cbId, async () => {
      checkVersionStringLimit(version)
      if (!pkgName.length) {
        throw new SyscallError(Errno.EINVAL)
      }

      await this.index.registerPackage(pkgName, version)
    })
  }

  // func removePackage(pkgName string, cb int)
  @WasmExport('removePackage')
  removePackage(sp: number, stack: StackReader, mem: MemoryView) {
    stack.skipHeader()
    const pkgName = stack.next<string>(GoStringType)
    const cbId = stack.next<number>(Int)
    if (!cbId) {
      throw new SyscallError(Errno.EBADSLT)
    }

    this.helper.doAsync(cbId, async () => {
      if (!pkgName.length) {
        throw new SyscallError(Errno.EINVAL)
      }

      const ok = await this.index.removePackage(pkgName)
      if (!ok) {
        throw new SyscallError(Errno.ENOENT)
      }
    })
  }
}
