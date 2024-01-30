import { Package, PackageBinding, WasmExport } from '~/lib/gowasm'
import { Int, type MemoryView, type SliceHeader, SliceHeaderType, type StackReader, stringDecoder } from '~/lib/go'
import { type ConsoleHandler, type ConsoleStreamType } from './console'

/**
 * WASM imports binding to console input/output.
 *
 * @see internal/gowasm/stdio_js.go
 */
@Package('github.com/x1unix/go-playground/internal/gowasm')
export class ConsoleBinding extends PackageBinding {
  constructor(private readonly handler: ConsoleHandler) {
    super()
  }

  // func wasmConsoleWrite(fd int, data []byte)
  @WasmExport('wasmConsoleWrite')
  consoleWrite(sp: number, stack: StackReader, mem: MemoryView) {
    stack.skipHeader()
    const fd = stack.next<ConsoleStreamType>(Int)
    const slice = stack.next<SliceHeader>(SliceHeaderType)

    if (!slice.len || !slice.data) {
      return
    }

    const msg = stringDecoder.decode(mem.get(slice.data, slice.len, false))
    this.handler.write(fd, msg)
  }
}
