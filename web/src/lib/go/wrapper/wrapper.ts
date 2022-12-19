import { StackReader } from "../stack";
import { MemoryInspector} from "../debug";
import { GoInstance, ImportObject, PendingEvent } from "./interface";
import {
  bindPrototype,
  GoWebAssemblyInstance,
  wrapWebAssemblyInstance
} from "./instance";

export type CallImportHandler = (sp: number, reader: StackReader) => any;

export interface Options {
  debug?: boolean
}

export class GoWrapper {
  private _inspector: MemoryInspector|null = null;
  private _debug = false;
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

  get stackPointer() {
    return this.exports.getsp();
  }

  constructor(parent: GoInstance, globalValue: object, {debug = false}: Options = {}) {
    this.go = parent;
    this._debug = debug;
    this._globalValue = bindPrototype({
      Go: GoWrapper
    }, globalValue);
    this.patchImportObject();
  }

  private patchImportObject() {
    this.go.importObject.go['runtime.resetMemoryDataView'] = (sp) => {
      sp >>>= 0;
      this.go.mem = new DataView(this.exports.mem.buffer);
      this._inspector = new MemoryInspector(this.go.mem);
    };
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
  callEventById(id, ...args) {
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
      if (this._debug) {
        console.log(`CallImport: ${name} (SP: ${sp.toString(16)})`);
      }

      const reader = new StackReader(this.go.mem, sp, {debug: this._debug});
      return func(sp, reader);
    }
  }

  _makeFuncWrapper(id: number) {
    return (...args): any => {
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
