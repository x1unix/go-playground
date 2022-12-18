import {AbstractTypeSpec} from '../spec';

export interface AttributeDescriptor {
  key: string
  type: AbstractTypeSpec
}

export class StructTypeSpec extends AbstractTypeSpec {
  private readonly _attributes: AttributeDescriptor[];
  private readonly _firstAttr: AbstractTypeSpec;

  /**
   *
   * @param name Struct name
   * @param {AttributeDescriptor[]} attrs attribute descriptors
   */
  constructor(name: string, attrs: AttributeDescriptor[]) {
    super(name, 0, 0, 0);

    if (!attrs.length) {
      throw new ReferenceError(`${this.constructor.name}: missing struct attributes`);
    }

    const [ firstElem ] = attrs;
    const totalSize = attrs
      .map(({type}) => type.size + type.padding)
      .reduce((total, size) => total + size, 0);

    this.setTypeDescriptor({
      size: totalSize,
      alignment: firstElem.type.alignment,
      padding: 0
    });

    this._attributes = attrs;
    this._firstAttr = firstElem.type;
  }

  get alignment() {
    return this._firstAttr.alignment;
  }

  alignAddress(addr) {
    return this._firstAttr.alignAddress(addr);
  }

  read(view, addr) {
    const address = this._firstAttr.alignAddress(addr);
    let offset = address;

    const entries: [string, any][] = [];
    for (let attr of this._attributes) {
      const {key, type} = attr;
      const fieldAddr = type.alignAddress(offset);
      const {value, endOffset} = type.read(view, fieldAddr);
      entries.push([key, value]);
      offset = endOffset;
    }

    return {
      address,
      endOffset: offset,
      value: Object.fromEntries(entries)
    };
  }

  write(view, addr, val) {
    const address = this._firstAttr.alignAddress(addr);
    let offset = address;
    for (let attr of this._attributes) {
      const {key, type} = attr;
      if (!val[key]) {
        throw new ReferenceError(`${this.constructor.name}.write: missing object property "${key}"`)
      }

      const fieldAddr = type.alignAddress(offset)
      const { endOffset } = type.write(view, fieldAddr, val[key]);
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
