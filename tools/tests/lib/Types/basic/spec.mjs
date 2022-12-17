import { AbstractTypeSpec } from '../spec.mjs';

/**
 * @typedef {Object} DataViewDescriptor
 * @property {Function} read
 * @property {Function} write
 */

const MAX_INT32 = 4294967296;

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

  decode(view, addr) {
    return this._readMethod.call(view, addr, true);
  }

  encode(view, addr, data) {
    this._writeMethod.call(view, addr, data, true);
  }
}

export class BooleanTypeSpec extends AbstractTypeSpec {
  constructor() {
    super('bool', 1, 1, 0);
  }

  decode(view, addr) {
    const val = view.getUint8(addr);
    return !!val;
  }

  encode(view, addr, data) {
    view.setUint8(addr, +data);
  }
}

export class UInt64TypeSpec extends AbstractTypeSpec {
  constructor(name) {
    super(name, 8, 8, 0);
  }

  decode(view, addr) {
    const low = view.getUint32(addr, true);
    const high = view.getInt32(addr + 4, true);

    return low + high * MAX_INT32;
  }

  encode(view, addr, val) {
    view.setUint32(addr, val, true);
    view.setUint32(addr + 4, Math.floor(val / MAX_INT32), true);
  }
}