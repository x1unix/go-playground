import { StackReader } from "../stack";
import { MemoryInspector} from "../debug";
import { Bool, GoStringType } from "../types";
import { GoInstance, ImportObject, PendingEvent } from "./interface";
import {Func, Ref, RefType} from "../pkg/syscall/js";

import {
  GoWebAssemblyInstance,
  wrapWebAssemblyInstance
} from "./instance";

/**
 * Wraps global namespace with specified overlay and replaces Go class instance
 * with a correct one.
 *
 * @param overlay Overlay object
 * @param globalValue global namespace
 */
export const wrapGlobal = (overlay: object = {}, globalValue: object = window || globalThis || DedicatedWorkerGlobalScope) => {
  const mockObject = {
    ...overlay,
    Go: GoWrapper,
  };

  for (let key in globalValue) {
    if (key === 'Go') {
      continue;
    }

    const prop = globalValue[key];
    if (typeof prop !== 'function') {
      mockObject[key] = prop;
      continue;
    }

    mockObject[key] = (...args) => (
      Reflect.apply(
        Reflect.get(globalValue, key),
        globalValue,
        args
      )
    );
  }

  Object.setPrototypeOf(mockObject, globalValue);
  return mockObject;
}

export type CallImportHandler = (sp: number, reader: StackReader) => any;

export interface Options {
  debug?: boolean
  debugSkipCalls?: string[]
  globalValue?: any
}

export class GoWrapper {
  private _inspector: MemoryInspector|null = null;
  private _debug = false;
  private _debugSkipCalls: Set<string>;
  private _globalValue: object;
  private go: GoInstance;

  /**
   * Returns WebAssembly memory inspector
   */
  get inspector() {
    return this._inspector;
  }

  get _pendingEvent() {
    return this.go._pendingEvent;
  }

  set _pendingEvent(value) {
    this.go._pendingEvent = value;
  }

  get memory() {
    return this.go.mem;
  }

  get importObject(): ImportObject {
    return this.go.importObject;
  }

  private get exports() {
    return this.go._inst!.exports;
  }

  constructor(parent: GoInstance, {debug = false, debugSkipCalls, globalValue}: Options = {}) {
    this.go = parent;
    this._debug = debug;
    this._debugSkipCalls = new Set(debugSkipCalls ?? []);
    this._globalValue = globalValue?.Go === GoWrapper ? globalValue : (
      wrapGlobal()
    );

    this.patchImportObject();
  }

  /**
   * Stores JS value in values table and returns value ref ID.
   * @param v
   * @private
   */
  private storeObject(v: any): number {
    if (!Ref.isReferenceableValue(v)) {
      return 0;
    }

    let id = this.go._ids.get(v);
    if (id === undefined) {
      id = this.go._idPool.pop();
      if (id === undefined) {
        id = this.go._values.length;
      }
      this.go._values[id] = v;
      this.go._goRefCounts[id] = 0;
      this.go._ids.set(v, id);
    }
    this.go._goRefCounts[id]++;
    return id;
  }

  private patchImportObject() {
    this.exportFunction('runtime.resetMemoryDataView', () => {
      this.go.mem = new DataView(this.exports.mem.buffer);
      this._inspector = new MemoryInspector(this.go.mem);
    })

    this.exportFunction('syscall/js.valueCall', (sp, reader) => {
      this.valueCall(sp, reader);
    })
  }

  private valueCall(sp: number, reader: StackReader) {
    reader.skipHeader();
    let result: any;
    let success: boolean;

    try {
      const obj = reader.nextRef();
      const methodName = reader.next<string>(GoStringType);
      const args = reader.nextRefSlice();

      if (this._debug) {
        const funcName = `${obj.constructor.name}.${methodName}`;
        console.log(`js.ValueCall: ${funcName}`, {
          obj, methodName, args
        });
      }

      const method = Reflect.get(obj, methodName);
      result = Reflect.apply(method, obj, args);
      success = true;
    } catch (err) {
      result = err;
      success = false;
      if (this._debug) {
        console.error(`js.ValueCall: Error - ${err}`);
      }
    }

    const resultRef = Ref.fromValue(result, this.storeObject(result));
    reader.updateStackPointer(this.go._inst!.exports!.getsp() >>> 0);
    reader.writer()
      .write(RefType, resultRef)
      .write(Bool, success);
  }

  /**
   * Loads a JS value from memory
   * @param addr
   * @private
   */
  private loadValue(addr: number) {
    const f = this.go.mem.getFloat64(addr, true);
    if (f === 0) {
      return;
    }

    if (!isNaN(f)) {
      return f;
    }

    const id = this.go.mem.getUint32(addr, true);
    return this.go._values[id];
  }

  /**
   * Replaces 'globalThis' value with desired global object.
   * @param globalValue
   * @private
   */
  private initReferences(globalValue: object) {
    // Should be in sync with 'wasm_exec.js';
    this.go._values = [
      NaN,
      0,
      null,
      true,
      false,
      globalValue,
      this,
    ];

    this.go._goRefCounts = new Array(this.go._values.length).fill(Infinity);
    let items: [any, number][] = [
      [0, 1],
      [null, 2],
      [true, 3],
      [false, 4],
      [globalValue, 5],
      [this, 6],
    ];
    this.go._ids = new Map(items);
    this.go._idPool = [];
    this.go.exited = false;
  }

  setGlobalObject(newGlobalThis: object) {
    this._globalValue = newGlobalThis;
    this.patchImportObject();
  }

  /**
   * Call exported Go function by event ID.
   *
   * See `syscall/js.funcs` map.
   *
   * @param id Event ID
   * @param args Arguments
   */
  callEventById(id, args: any[]) {
    const event: PendingEvent = {
      id,
      this: this,
      args
    };

    this.go._pendingEvent = event;
    this.go._resume();
    return event.result;
  }

  /**
   * Call exported `js.Func` callback
   * @param fn
   * @param args
   */
  callFunc(fn: Func, args: any[]) {
    return this.callEventById(fn.id, args);
  }

  /**
   * Adds function to import object
   * @param name symbol name (package.functionName)
   * @param func handler
   */
  exportFunction(name: string, func: CallImportHandler) {
    this.go.importObject.go[name] = this._wrapExportHandler(name, func);
  }

  /**
   * Register a CallImport handler
   * @param name method name
   * @param func
   * @returns {*}
   * @private
   */
  private _wrapExportHandler(name: string, func: CallImportHandler)
  {
    return (sp: number) => {
      sp >>>= 0;
      const isDebug = this._debug && !this._debugSkipCalls.has(name);
      if (isDebug) {
        console.log(`CallImport: ${name} (SP: ${sp.toString(16)})`);
      }

      const reader = new StackReader(
        this.go.mem,
        this.go._values,
        sp,
        {debug: isDebug}
      );

      return func(sp, reader);
    }
  }

  _makeFuncWrapper(id: number) {
    return (...args): any => {

      if (this._debug) {
       console.log('Go._makeFuncWrapper:', { id, args });
     }

     const event: any = { id, this: this.go, args }
     this.go._pendingEvent = event;
     this.go._resume();
     return event.result;
    }
  }

  /**
   * Start Go program
   */
  async run(instance: GoWebAssemblyInstance) {
    // Wrap wasm instance to re-initialise import object before run.
    const wrappedInstance = wrapWebAssemblyInstance(instance, {
      'run': () => {
        this.initReferences(this._globalValue);
      }
    });

    this._inspector = MemoryInspector.fromInstance(wrappedInstance);
    return this.go.run(wrappedInstance);
  }

  exit(code: number) {
    return this.go.exit(code);
  }

  _resume() {
    return this.go._resume();
  }
}