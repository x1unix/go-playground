import { hex } from './common.mjs';

/**
 * StackWriter provides functionality for writing data to Go stack frame.
 */
export default class StackWriter {
  _offset = 0;
  _debug = false;
  _retCount = 0;

  /**
   * @type {DataView}
   * @private
   */
  _mem = null;

  /**
   *
   * @param {DataView} mem
   * @param {number} sp
   * @param {boolean} debug
   */
  constructor(mem, sp, debug = false) {
    this._mem = mem;
    this._offset = sp;
    this._debug = debug;
  }

  get offset() {
    return this._offset;
  }

  /**
   * Skip n bytes
   * @param {number} count
   */
  skip(count) {
    this._offset += count;
  }

  /**
   * Push a value
   * @param {AbstractTypeSpec} typeSpec
   * @param {*} data
   *
   * @returns {StackWriter}
   */
  write(typeSpec, data) {
    if (!typeSpec) {
      throw new ReferenceError('StackReader.pop: missing type reader');
    }

    const { address, endOffset } = typeSpec.write(this._mem, this._offset, data);
    this._offset = endOffset;
    this._retCount++;

    if (this._debug) {
      console.log([
        `Ret: R${this._retCount}`,
        `(*${typeSpec.type})(${hex(address)})`,
        data.toString(),
      ].join(' '))
    }

    return this;
  }
}