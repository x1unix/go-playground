import './wasm-misc/wasm_exec.js';
import StackReader from './lib/StackReader.mjs';
import MemoryInspector from './lib/MemoryInspector.mjs';

/**
 * @callback CallImportHandler
 * @param {number} sp
 * @param {StackReader} reader
 */

const defaultOpts = {debug: false};

export default class CustomGo extends global.Go {
  MAX_I32 = Math.pow(2, 32);

  /**
   * @type {MemoryInspector}
   */
  _inspector;

  _debug = false;

  /**
   * Returns WebAssembly memory inspector
   * @returns {MemoryInspector}
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

  constructor(opts={}) {
    super();

    opts = Object.assign(defaultOpts, opts);
    this._debug = opts.debug;

    this.importObject.go['runtime.resetMemoryDataView'] = (sp) => {
      sp >>>= 0;
      this.mem = new DataView(this._inst.exports.mem.buffer);
      this._inspector = new MemoryInspector(this.mem);
    };
  }

  // Copied from 'setInt64'
  setInt64(offset, value) {
    this.mem.setUint32(offset + 0, value, true);
    this.mem.setUint32(offset + 4, this.MAX_I32, true);
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
   * @param {WebAssembly.Instance} instance
   */
  run(instance) {
    this._inspector = MemoryInspector.fromInstance(instance);
    super.run(instance);
  }
}