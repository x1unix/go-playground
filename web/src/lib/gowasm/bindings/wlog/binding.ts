import {Package, PackageBinding, WasmExport} from "~/lib/gowasm";
import {
  MemoryView,
  SliceHeader,
  SliceHeaderType,
  StackReader, stringDecoder,
  Uint8
} from '~/lib/go';
import {ConsoleLogger, Logger} from "~/lib/gowasm/bindings/wlog/logger";

enum LogLevel {
  Debug = 0,
  Info = 1
}

@Package('github.com/x1unix/go-playground/internal/gowasm/wlog')
export class LoggerBinding extends PackageBinding {
  constructor(private logger: Logger = ConsoleLogger) {
    super();
  }

  @WasmExport('logWrite')
  logWrite(sp: number, stack: StackReader, mem: MemoryView) {
    stack.skipHeader();
    const level = stack.next<LogLevel>(Uint8);
    const msgSlice = stack.next<SliceHeader>(SliceHeaderType);
    const msg = stringDecoder.decode(
      mem.get(msgSlice.data, msgSlice.len, false)
    );

    if (level === LogLevel.Debug) {
      this.logger.debug(msg);
      return;
    }

    this.logger.info(msg);
  }
}
