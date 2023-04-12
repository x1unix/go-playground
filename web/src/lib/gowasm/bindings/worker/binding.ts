import {Package, PackageBinding, WasmExport} from "~/lib/gowasm";
import {Func, FuncType} from "~/lib/go/pkg/syscall/js";
import {
  MemoryView,
  StackReader,
  SliceOf,
  GoStringType,
  GoWrapper
} from "~/lib/go";
import {Worker, WorkerListener} from "./types";

@Package('github.com/x1unix/go-playground/internal/gowasm')
export class WorkerBinding<T extends Worker> extends PackageBinding {
  constructor(private go: GoWrapper, private handler: WorkerListener<T>) {
    super();
  }

  // func registerWorkerEntrypoint(methods []string, handler js.Func)
  @WasmExport('registerWorkerEntrypoint')
  registerWorkerEntrypoint(sp: number, stack: StackReader, mem: MemoryView) {
    // TODO: figure out why js.Func is not valid (Go: 24 but calculated size is 20)
    stack.skipHeader();
    const methods = stack.next<string[]>(SliceOf<string>(GoStringType));
    const callbackHandler = stack.next<Func>(FuncType);
    const exportObj: T = Object.fromEntries(methods.map(m => [
      m,
      (...args) => this.go.callFunc(callbackHandler, [m, ...args])
    ])) as any;
    this.handler.onWorkerRegister(exportObj);
  }
}
