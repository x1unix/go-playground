import { Package, PackageBinding, WasmExport } from '~/lib/gowasm'
import { type Func, FuncType } from '~/lib/go/pkg/syscall/js'
import { type MemoryView, type StackReader, SliceOf, GoStringType, type GoWrapper } from '~/lib/go'
import { type Worker, type WorkerListener } from './types'

@Package('github.com/x1unix/go-playground/internal/gowasm')
export class WorkerBinding<T extends Worker> extends PackageBinding {
  constructor(
    private readonly go: GoWrapper,
    private readonly handler: WorkerListener<T>,
  ) {
    super()
  }

  // func registerWorkerEntrypoint(methods []string, handler js.Func)
  @WasmExport('registerWorkerEntrypoint')
  registerWorkerEntrypoint(sp: number, stack: StackReader, mem: MemoryView) {
    // TODO: figure out why js.Func is not valid (Go: 24 but calculated size is 20)
    stack.skipHeader()
    const methods = stack.next<string[]>(SliceOf<string>(GoStringType))
    const callbackHandler = stack.next<Func>(FuncType)
    const exportObj: T = Object.fromEntries(
      methods.map((m) => [m, (...args) => this.go.callFunc(callbackHandler, [m, ...args])]),
    ) as any
    this.handler.onWorkerRegister(exportObj)
  }
}
