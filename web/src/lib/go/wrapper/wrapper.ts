import { StackReader } from "../stack";
import { MemoryInspector} from "../debug";
import { GoClassStub, PendingEvent } from "./interface";
import { wrapWebAssemblyInstance} from "./instance";

export type CallImportHandler = (sp: number, reader: StackReader) => any;

export interface Options {
  debug?: boolean
}

export class GoWrapper extends GoClassStub {
  private _inspector: MemoryInspector|null = null;
  private _debug = false;
  private _globalValue: object;

  private encoder = new TextEncoder();
  private decoder = new TextDecoder("utf-8");

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
    return this._inst?.exports.getsp();
  }

  constructor(globalValue: object = globalThis, {debug = false}: Options) {
    super();
    this._debug = debug;
    this._globalValue = globalValue;
    this.patchImportObject();
  }

  private patchImportObject() {
    this.importObject.go['runtime.resetMemoryDataView'] = (sp) => {
      sp >>>= 0;
      this.mem = new DataView(this._inst!.exports.mem.buffer);
      this._inspector = new MemoryInspector(this.mem);
    };
  }

  /**
   * Replaces 'globalThis' value with desired global object.
   * @param globalValue
   * @private
   */
  private initReferences(globalValue: object) {
    // Should be in sync with 'wasm_exec.js';
    this._values = [
      NaN,
      0,
      null,
      true,
      false,
      globalValue,
      this,
    ];

    this._goRefCounts = new Array(this._values.length).fill(Infinity);
    let items: [any, number][] = [
      [0, 1],
      [null, 2],
      [true, 3],
      [false, 4],
      [globalValue, 5],
      [this, 6],
    ];
    this._ids = new Map(items);
    this._idPool = [];
    this.exited = false;
  }

  loadValue(addr: number) {
    if (!this.mem) {
      return;
    }

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
   * @param name symbol name (package.functionName)
   * @param func handler
   */
  exportFunction(name: string, func: CallImportHandler) {
    this.importObject.go[name] = this._wrapExportHandler(name, func);
  }

  /**
   * Register a CallImport handler
   * @param name method name
   * @param func
   * @returns {*}
   * @private
   */
  _wrapExportHandler(name: string, func: CallImportHandler)
  {
    return (sp: number) => {
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
    // Wrap wasm instance to re-initialise import object before run.
    const wrappedInstance = wrapWebAssemblyInstance(instance, {
      'run': () => {
        this.initReferences(this._globalValue);
      }
    });

    this._inspector = MemoryInspector.fromInstance(wrappedInstance);
    return super.run(wrappedInstance);
  }
}
