import {ExportFunction, Package, PackageBinding} from '~/lib/gowasm/binder';
import {GoWrapper, js, StackReader} from '~/lib/go';

/**
 * SyscallHelper contains extensions required for "gowasm" package.
 *
 * See: internal/gowasm/callback_js.go
 */
@Package('github.com/x1unix/go-playground/internal/gowasm')
export default class SyscallHelper extends PackageBinding {
  private callbackFunc?: js.Func

  constructor(private go: GoWrapper) {
    super();
  }

  @ExportFunction('registerCallbackHandler')
  private registerCallbackHandler(sp: number, reader: StackReader) {
    reader.skipHeader();
    const callbackFunc = reader.next<js.Func>(js.FuncType);
    console.log('js: registered callback handler', callbackFunc);
    this.callbackFunc = callbackFunc;
  }

  /**
   * Send and notify Go about callback result.
   * @param callbackId Callback ID
   * @param result Result
   */
  sendCallbackResult(callbackId: number, result: number) {
    if (!this.callbackFunc) {
      throw new Error('SyscallHelper: callback handler not registered.');
    }

    this.go.callFunc(this.callbackFunc, [callbackId, result]);
  }
}
