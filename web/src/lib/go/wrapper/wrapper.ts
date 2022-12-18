import { StackReader } from "../stack";
import { MemoryInspector} from "../debug";
import {
  GoClass,
  GoWebAssemblyInstance,
  PendingEvent
} from "./interface";

export type CallImportHandler = (sp: number, reader: StackReader) => any;

export interface Options {
  debug?: boolean
}

export class GoWrapper extends GoClass {
  private _inspector: MemoryInspector|null = null;
  private _debug = false;

  /**
   * Returns WebAssembly memory inspector
   */
  get inspector() {
    return this._inspector;
  }

  get memory() {
    return this.mem;
  }

  get stackPointer() {
    return this._inst.exports.getsp();
  }

  constructor(instance: GoWebAssemblyInstance, {debug = false}: Options) {
    super(instance);
    this._debug = debug;
  }

  patchImportObject() {
    this.importObject.go['runtime.resetMemoryDataView'] = (sp) => {
      sp >>>= 0;
      this.mem = new DataView(this._inst.exports.mem.buffer);
      this._inspector = new MemoryInspector(this.mem);
    };
  }

  loadValue(addr) {
    const f = this.mem.getFloat64(addr, true);
    if (f === 0) {
      return undefined;
    }
    if (!isNaN(f)) {
      return f;
    }

    const id = this.mem.getUint32(addr, true);
    return this._values[id];
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

    this._pendingEvent = event;
    this._resume();
    return event.result;
  }

  /**
   * Adds function to import object
   * @param {string} name symbol name (package.functionName)
   * @param {CallImportHandler} func handler
   */
  exportFunction(name, func) {
    this.importObject.go[name] = this._wrapExportHandler(name, func);
  }

  /**
   * Register a CallImport handler
   * @param {string} name method name
   * @param {CallImportHandler} func
   * @returns {*}
   * @private
   */
  _wrapExportHandler(name, func)
  {
    return (sp) => {
      sp >>>= 0;
      if (this._debug) {
        console.log(`CallImport: ${name} (SP: ${sp.toString(16)})`);
      }

      const reader = new StackReader(this.mem, sp, {debug: this._debug});
      return func(sp, reader);
    }
  }

  /**
   * Start Go program
   */
  async run(instance) {
    this._inspector = MemoryInspector.fromInstance(instance);
    return super.run(instance);
  }
}
