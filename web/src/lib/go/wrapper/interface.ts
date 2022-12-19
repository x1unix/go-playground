import { GoWebAssemblyInstance } from "./instance";

export type JSValuesTable = any[];

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

export interface GoInstance {
  mem: DataView;
  argv: string[];
  env: {[k: string]: string};
  importObject: ImportObject;

  /**
   * whether the Go program has exited
   */
  exited: boolean;

  _pendingEvent?: PendingEvent;
  _scheduledTimeouts: Map<number, any>;
  _nextCallbackTimeoutID: number;
  _inst?: GoWebAssemblyInstance;

  /**
   * JS values that Go currently has references to, indexed by reference id
   * @protected
   */
  _values: JSValuesTable;

  /**
   * Number of references that Go has to a JS value, indexed by reference id
   * @protected
   */
  _goRefCounts: any[];

  /**
   * Mapping from JS values to reference ids
   * @protected
   */
  _ids: Map<any, number>;

  /**
   * Unused ids that have been garbage collected
   * @protected
   */
  _idPool: number[];

  _makeFuncWrapper(id: number): FuncWrapper
  run(instance: GoWebAssemblyInstance): Promise<void>;
  exit(code: number);
  _resume();
}
