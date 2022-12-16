import {AbstractTypeSpec} from './primitive.mjs';

/**
 * @typedef {Object} AttributeDescriptor
 * @property {string} key
 * @property {AbstractTypeSpec} type
 */

export class StructTypeSpec extends AbstractTypeSpec {
  /**
   * @type {AttributeDescriptor[]}
   * @private
   */
  _attributes = [];

  /**
   * @type {AbstractTypeSpec}
   * @private
   */
  _firstAttr;

  /**
   *
   * @param name Struct name
   * @param {AttributeDescriptor[]} attrs attribute descriptors
   */
  constructor(name, attrs) {
    if (!attrs.length) {
      throw new ReferenceError('StructTypeSpec: missing struct attributes');
    }

    const [ firstElem ] = attrs;
    const totalSize = attrs
      .map(({type}) => type.size + type._skip)
      .reduce((total, size) => total + size, 0);

    super(name, totalSize, firstElem.type.alignment, 0);

    this._attributes = attrs;
    this._firstAttr = firstElem.type;
  }

  alignAddress(addr) {
    return this._firstAttr.alignAddress(addr);
  }

  read(view, addr) {
    let startAddr = addr;
    const entries = [];
    for (let attr of this._attributes) {
      const {key, type} = attr;
      const {address} = type.alignAddress(startAddr);
      const value = type.read(view, address);
      entries.push([key, value]);
      startAddr = address + type.size + type.padding;
    }

    return Object.fromEntries(entries);
  }

  write(view, addr, val) {
    let startAddr = addr;
    for (let attr of this._attributes) {
      const {key, type} = attr;
      if (!val[key]) {
        throw new ReferenceError(`${this.constructor.name}.write: missing object property "${key}"`)
      }

      const { address } = type.alignAddress(startAddr);
      type.write(view, address, val);
      startAddr = address + type.size + type.padding;
    }
  }
}