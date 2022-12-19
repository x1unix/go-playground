import { AbstractTypeSpec } from "~/lib/go/types/spec";

export class ArrayTypeSpec extends AbstractTypeSpec {
  private readonly _elemType: AbstractTypeSpec;
  private readonly _length = 0;

  /**
   * @param {AbstractTypeSpec} elemType Array item type
   * @param {number} length Array size
   */
  constructor(elemType, length) {
    super(
      `[${length}]${elemType.name}`,
      (elemType.size + elemType.padding) * length,
      elemType.alignment,
      0
    );

    if (length < 0) {
      throw new Error(`${this.constructor.name}: array item count should be greater than zero`);
    }

    this._elemType = elemType;
    this._length = length;
  }

  /**
   * Returns array element type.
   * @returns {AbstractTypeSpec}
   */
  get elemType() {
    return this._elemType;
  }

  get length() {
    return this._length;
  }

  get alignment() {
    return this._elemType.alignment;
  }

  alignAddress(addr) {
    return this._elemType.alignAddress(addr);
  }

  read(view, addr, buff) {
    const address = this._elemType.alignAddress(addr);
    let offset = address;
    const entries: any[] = [];

    for (let i = 0; i < this._length; i++) {
      const elemAddr = this._elemType.alignAddress(offset);
      const { value, endOffset } = this._elemType.read(view, elemAddr, buff);
      entries.push(value);
      offset = endOffset;
    }

    return {
      address,
      endOffset: offset,
      value: entries
    };
  }

  write(view, addr, val, buff) {
    if (val.length !== this._length) {
      throw new Error(
        `${this.constructor.name}.write: array length should be ${this._length} (got: ${val.length})`
      );
    }

    const address = this._elemType.alignAddress(addr);
    let offset = address;

    for (let i = 0; i < this._length; i++) {
      const itemAddr = this._elemType.alignAddress(offset);
      const { endOffset } = this._elemType.write(view, itemAddr, val[i], buff);
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
