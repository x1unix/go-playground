import { AbstractTypeSpec } from '../primitive.mjs';

export class ArrayTypeSpec extends AbstractTypeSpec {
  /**
   * @type {AbstractTypeSpec}
   * @private
   */
  _itemType;

  /**
   * @type {number}
   * @private
   */
  _length = 0;

  /**
   * @param {AbstractTypeSpec} itemType Array item type
   * @param {number} length Array size
   */
  constructor(itemType, length) {
    if (length < 0) {
      throw new Error(`ArrayTypeSpec: array item count should be greater than zero`);
    }

    super(
      `[${length}]${itemType.name}`,
      (itemType.size + itemType.padding) * length,
      itemType.alignment,
      0
    );

    this._itemType = itemType;
    this._length = length;
  }

  /**
   * Returns array element type.
   * @returns {AbstractTypeSpec}
   */
  get itemType() {
    return this._itemType;
  }

  get length() {
    return this._length;
  }

  get alignment() {
    return this._itemType.alignment;
  }

  alignAddress(addr) {
    return this._itemType.alignAddress(addr);
  }

  read(view, addr) {
    const address = this._itemType.alignAddress(addr);
    let offset = address;
    const entries = [];

    for (let i = 0; i < this._length; i++) {
      const elemAddr = this._itemType.alignAddress(offset);
      const { value, endOffset } = this._itemType.read(view, elemAddr);
      entries.push(value);
      offset = endOffset;
    }

    return {
      address,
      endOffset: offset,
      value: entries
    };
  }

  write(view, addr, val) {
    if (val.length !== this._length) {
      throw new Error(
        `${this.constructor.name}.write: array length should be ${this._length} (got: ${val.length})`
      );
    }

    const address = this._itemType.alignAddress(addr);
    let offset = address;

    for (let i = 0; i < this._length; i++) {
      const itemAddr = this._itemType.alignAddress(offset);
      const { endOffset } = this._itemType.write(view, itemAddr, val[i]);
      offset = endOffset;
    }

    return {
      address,
      endOffset: offset
    };
  }

  encode(view, addr, val) {
    throw new Error(`${this.constructor.name}.encode: not supported, use write() instead`);
  }

  decode(view, addr) {
    throw new Error(`${this.constructor.name}.decode: not supported, use read() instead`);
  }
}