import { alignAddr } from './common.mjs';

/**
 * @typedef {Object} AlignedAddress
 * @property {number} address
 * @property {number} delta
 * @property {*} value
 */

/**
 * @typedef {Object} DataViewDescriptor
 * @property {Function} read
 * @property {Function} write
 */

const MAX_INT32 = 4294967296;

export class AbstractTypeSpec {
  _size = 0;
  _align = 1;
  _skip = 0;
  _type = '';

  /**
   * @param {string} type Original type name.
   * @param {number} size Type size.
   * @param {number} align Type alignment.
   * @param {number} skip Number of bytes to skip.
   */
  constructor(type, size, align = 1, skip = 0) {
    this._size = size;
    this._align = align;
    this._skip = skip;
    this._type = type;
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
  get type() {
    return this._type;
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
   * @returns {AlignedAddress} Normalized address
   */
  alignAddress(addr) {
    if (addr % this._align === 0) {
      // Address is aligned
      return {
        address: addr,
        delta: 0
      };
    }

    const alignedAddr = alignAddr(addr, this._align);
    return {
      address: alignedAddr,
      delta: alignedAddr - addr
    }
  }

  /**
   * Returns a value from memory.
   *
   * @param {DataView} view Memory
   * @param {number} sp Stack pointer
   * @returns {*}
   */
  read(view, sp) {
    throw new Error('TypeSpec.read: not implemented');
  }

  /**
   * Serialize and write data
   * @param {DataView} view
   * @param {number} addr
   * @param {*} val
   * @returns {*}
   */
  write(view, addr, val) {
    throw new Error('TypeSpec.write: not implemented');
  }
}

export class DataViewableTypeSpec extends AbstractTypeSpec {
  /**
   * @type {Function}
   * @private
   */
  _readMethod;

  /**
   * @type {Function}
   * @private
   */
  _writeMethod;

  /**
   *
   * @param {string} name
   * @param {number} size
   * @param {number} align
   * @param {number} skip
   * @param {DataViewDescriptor} rwObj
   */
  constructor(name, size, align, skip, rwObj) {
    super(name, size, align, skip);
    this._readMethod = rwObj.read;
    this._writeMethod = rwObj.write;
  }

  read(view, addr) {
    return this._readMethod.call(view, addr, true);
  }

  write(view, addr, data) {
    this._writeMethod.call(view, addr, data, true);
  }
}

export class BooleanTypeSpec extends AbstractTypeSpec {
  constructor() {
    super('bool', 1, 1, 0);
  }

  read(view, addr) {
    const val = view.getUint8(addr);
    return !!val;
  }

  write(view, addr, data) {
    view.setUint8(addr, +data);
  }
}

export class UInt64TypeSpec extends AbstractTypeSpec {
  constructor(name) {
    super(name, 8, 8, 0);
  }

  read(view, addr) {
    const low = view.getUint32(addr, true);
    const high = view.getInt32(addr + 4, true);

    return low + high * MAX_INT32;
  }

  write(view, addr, val) {
    view.setUint32(addr, val, true);
    view.setUint32(addr + 4, Math.floor(val / MAX_INT32), true);
  }
}