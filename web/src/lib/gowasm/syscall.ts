import { WasmExport, Package, PackageBinding } from '~/lib/gowasm/binder'
import { type GoWrapper, js, type StackReader } from '~/lib/go'
import { Errno, SyscallError } from '~/lib/go/pkg/syscall'

// list of syscall errors which should not be logged.
const suppressedErrors = new Set([Errno.ENOENT])

/**
 * SyscallHelper contains extensions required for "gowasm" package.
 *
 * See: internal/gowasm/callback_js.go
 */
@Package('github.com/x1unix/go-playground/internal/gowasm')
export default class SyscallHelper extends PackageBinding {
  private callbackFunc?: js.Func

  constructor(
    private readonly go: GoWrapper,
    private readonly debug = false,
  ) {
    super()
  }

  @WasmExport('registerCallbackHandler')
  private registerCallbackHandler(sp: number, reader: StackReader) {
    reader.skipHeader()
    const callbackFunc = reader.next<js.Func>(js.FuncType)
    console.log('js: registered callback handler', callbackFunc)
    this.callbackFunc = callbackFunc
  }

  /**
   * Send and notify Go about callback result.
   * @param callbackId Callback ID
   * @param result Result
   */
  sendCallbackResult(callbackId: number, result: number) {
    if (!this.callbackFunc) {
      throw new Error('SyscallHelper: callback handler not registered.')
    }

    if (this.debug) {
      console.log('SyscallHelper: sendCallbackResult', { callbackId, result })
    }

    this.go.callFunc(this.callbackFunc, [callbackId, result])
  }

  /**
   * Reports async error back to Go caller.
   *
   * If passed error is SyscallError, it will use its origin error code.
   * @param callbackId
   * @param err
   */
  sendErrorResult(callbackId: number, err: Error | DOMException | Errno) {
    const sysErr = SyscallError.fromError(err)
    if (!suppressedErrors.has(sysErr.errno)) {
      console.error(`gowasm: async callback thrown an error: ${err} (errno: ${sysErr.errno}, id: ${callbackId})`)
    }
    this.sendCallbackResult(callbackId, sysErr.errno)
  }

  /**
   * Perform async operation and return result to the Go worker by callback ID.
   *
   * Any throw error will be sent as error code back to Go worker.
   *
   * @param callbackId Callback ID
   * @param fn Async function
   */
  doAsync(callbackId: number, fn: () => Promise<void>) {
    try {
      fn()
        .then(() => {
          this.sendCallbackResult(callbackId, 0)
        })
        .catch((err: Error) => {
          this.sendErrorResult(callbackId, err)
        })
    } catch (err) {
      this.sendErrorResult(callbackId, err as Error)
    }
  }
}
