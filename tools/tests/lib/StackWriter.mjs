import { hex } from './common.mjs';

/**
 * StackWriter provides functionality for writing data to Go stack frame.
 */
export default class StackWriter {
  _addr = 0;
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
    this._addr = sp;
    this._debug = debug;
  }

  get addr() {
    return this._addr;
  }

  /**
   * Skip n bytes
   * @param {number} count
   */
  skip(count) {
    this._addr += count;
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

    const {address, delta} = typeSpec.alignAddress(this._addr);
    typeSpec.write(this._mem, address, data);
    this._addr += delta + typeSpec.size;
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