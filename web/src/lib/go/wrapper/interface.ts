export interface PendingEvent {
  this: any
  id: number
  args?: any[]
  result?: any
}

type ImportFunction = (sp: number) => any;
type FuncWrapper = () => PendingEvent['result'];

export interface ImportObject {
  go: {[k: string]: ImportFunction}
}

export interface GoWebAssemblyInstance extends WebAssembly.Instance {
  exports: {
    mem: WebAssembly.Memory
    getsp(): number
    resume()
    run()
  }
}

/**
 * GoClass is a fake Go-alike class that will be swapped
 * with real Go class during wrapper initialization.
 */
export class GoClass {
  mem: DataView;
  argv: string[] = [];
  env: {[k: string]: string} = {};
  importObject: ImportObject = {go: {}};

  protected _pendingEvent?: PendingEvent|null;
  protected _scheduledTimeouts = new Map<number, any>();
  protected _nextCallbackTimeoutID: number = 0;
  protected _inst: GoWebAssemblyInstance;
  protected _values: {[k: string]: any} = {};

  constructor(instance: GoWebAssemblyInstance) {
    this._inst = instance;
    this.mem = new DataView(instance.exports.mem.buffer);
  }

  protected _resume() {}
  protected _makeFuncWrapper(id: number): FuncWrapper {
    return () => null;
  }

  exit(code: number) {};
  async run(instance: WebAssembly.Instance): Promise<void> {
    return Promise.reject('stub');
  }
}
