import { GoWebAssemblyInstance } from "./instance";

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

/**
 * GoClassStub is a fake Go-alike class that will be swapped
 * with real Go class during wrapper initialization.
 */
export class GoClassStub {
  mem?: DataView;
  argv: string[] = [];
  env: {[k: string]: string} = {};
  importObject: ImportObject = {go: {}};

  /**
   * whether the Go program has exited
   */
  exited = false;

  protected _pendingEvent?: PendingEvent|null;
  protected _scheduledTimeouts = new Map<number, any>();
  protected _nextCallbackTimeoutID: number = 0;
  protected _inst?: GoWebAssemblyInstance;

  /**
   * JS values that Go currently has references to, indexed by reference id
   * @protected
   */
  protected _values: any[] = [];

  /**
   * Number of references that Go has to a JS value, indexed by reference id
   * @protected
   */
  protected _goRefCounts: any[] = [];

  /**
   * Mapping from JS values to reference ids
   * @protected
   */
  protected _ids = new Map<any, number>();

  /**
   * Unused ids that have been garbage collected
   * @protected
   */
  protected _idPool: number[] = [];

  constructor() {}

  protected _resume() {}
  protected _makeFuncWrapper(id: number): FuncWrapper {
    return () => null;
  }

  exit(code: number) {};
  async run(instance: GoWebAssemblyInstance): Promise<void> {
    this._inst = instance;
    this.mem = new DataView(instance.exports.mem.buffer);
    return Promise.reject('stub');
  }
}
