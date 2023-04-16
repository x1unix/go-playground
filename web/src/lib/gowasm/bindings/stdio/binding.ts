import {Package, PackageBinding, WasmExport} from "~/lib/gowasm";
import {
  Int,
  MemoryView,
  SliceHeader,
  SliceHeaderType,
  StackReader,
  stringDecoder
} from "~/lib/go";
import {
  ConsoleHandler,
  ConsoleStreamType
} from "./console";

/**
 * WASM imports binding to console input/output.
 *
 * @see internal/gowasm/stdio_js.go
 */
@Package('github.com/x1unix/go-playground/internal/gowasm')
export class ConsoleBinding extends PackageBinding {
  constructor(private handler: ConsoleHandler) {
    super();
  }

  // func wasmConsoleWrite(fd int, data []byte)
  @WasmExport('wasmConsoleWrite')
  consoleWrite(sp: number, stack: StackReader, mem: MemoryView) {
    stack.skipHeader();
    const fd = stack.next<ConsoleStreamType>(Int);
    const slice = stack.next<SliceHeader>(SliceHeaderType);

    if (!slice.len || !slice.data) {
      return;
    }

    const msg = stringDecoder.decode(mem.get(slice.data, slice.len, false));
    this.handler.write(fd, msg);
  }
}
