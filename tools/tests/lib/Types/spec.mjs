import { alignAddr } from './common.mjs';

/**
 * @typedef {Object} ReadResult
 * @property {number} address Aligned value address
 * @property {number} endOffset Value end address
 * @property {*} value Extracted value
 */

/**
 * @typedef {Object} WriteResult
 * @property {number} address Aligned value address
 * @property {number} endOffset Value end address
 */

/**
 * Base class for type read and write implementation.
 *
 * @abstract
 */
export class AbstractTypeSpec {
  _size = 0;
  _align = 1;
  _skip = 0;
  _name = '';

  /**
   * @param {string} name Original type name.
   * @param {number} size Type size.
   * @param {number} align Type alignment.
   * @param {number} skip Number of bytes to skip.
   */
  constructor(name, size, align = 1, skip = 0) {
    this._size = size;
    this._align = align;
    this._skip = skip;
    this._name = name;
  }

  /**
   * Number of bytes reserved after value contents.
   * @returns {number}
   */
  get padding() {
    return this._skip;
  }

  /**
   * Returns value type size.
   * @returns {number}
   */
  get size() {
    return this._size;
  }

  /**
   * @type {string}
   */
  get name() {
    return this._name;
  }

  /**
   * Returns type alignment
   * @returns {number}
   */
  get alignment() {
    return this._align;
  }

  /**
   * Align pointer address
   * @param {number} addr
   * @returns {number} Aligned address
   */
  alignAddress(addr) {
    if (addr % this._align === 0) {
      // Address is aligned
      return addr;
    }

    return alignAddr(addr, this._align);
  }

  /**
   * Decodes a value from DataView at passed address and returns a value.
   * Passed address should be aligned.
   *
   * Please consider `read()` for general-purpose use.
   *
   * @abstract
   * @param {DataView} view
   * @param {number} addr
   * @returns {*}
   */
  decode(view, addr) {
    throw new Error(`${this.constructor.name}.decode: not implemented`);
  }

  /**
   * Encodes and puts value to DataView at passed address.
   * Passed address should be aligned.
   *
   * Please consider `write()` for general-purpose use.
   *
   * @abstract
   * @param {DataView} view
   * @param {number} addr
   * @param {*} val
   */
  encode(view, addr, val) {
    throw new Error(`${this.constructor.name}.encode: not implemented`);
  }

  /**
   * Reads value at specified offset in memory and returns
   * a value with end offset address.
   *
   * Passed offset address will be aligned before read.
   *
   * @param {DataView} view Memory
   * @param {number} addr Stack pointer
   * @returns {ReadResult}
   */
  read(view, addr) {
    let address = this.alignAddress(addr);
    const value = this.decode(view, address);
    return {
      value,
      address,
      endOffset: address + this.size + this.padding,
    };
  }

  /**
   * Encodes and writes a value to DataView at specifying address.
   * Passed address will be aligned before write.
   *
   * @param {DataView} view
   * @param {number} addr
   * @param {*} val
   * @returns {WriteResult}
   */
  write(view, addr, val) {
    const address = this.alignAddress(addr);
    this.encode(view, address, val);
    return {
      address,
      endOffset: address + this.size + this.padding
    };
  }
}