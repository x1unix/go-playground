/**
 * @typedef {Object} AlignedAddress
 * @property {number} address
 * @property {number} delta
 * @property {*} value
 */

const alignAddr = (addr, align) => ((addr + align - 1) / align) * align;

class AbstractTypeSpec {
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
   * Align pointer address
   * @param {number} addr
   * @returns {AlignedAddress} Normalized address
   */
  alignAddress(addr) {
    throw new Error('TypeSpec.alignAddress: not implemented');
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
}

class DataViewableTypeSpec extends AbstractTypeSpec {
  /**
   * @type {Function}
   * @private
   */
  _method;

  constructor(name, method, size, align, skip=0) {
    super(name, size, align, skip);
    this._method = method;
  }

  alignAddress(addr) {
    return {
      address: addr,
      delta: 0,
    };
  }

  read(view, addr) {
    return this._method.call(view, addr, true);
  }
}

class BooleanTypeSpec extends AbstractTypeSpec {
  constructor() {
    super('bool', 1, 1, 0);
  }

  alignAddress(addr) {
    return {
      address: addr,
      delta: 0,
    };
  }

  read(view, addr) {
    const val = view.getUint8(addr);
    return !!val;
  }
}

export const Sizeof = {
  INT32: 4,
  INT64: 8
}

export const Types = {
  Boolean: new BooleanTypeSpec(),
  Byte: new DataViewableTypeSpec('byte', DataView.prototype.getUint8, 1, 1, 0),
  Uint8: new DataViewableTypeSpec('uint8', DataView.prototype.getUint8, 1, 1, 3),
  Uint32: new DataViewableTypeSpec('uint32', DataView.prototype.getUint32, 4, 4, 0),
  Int32: new DataViewableTypeSpec('int32', DataView.prototype.getInt32, 4, 4, 0),
}
