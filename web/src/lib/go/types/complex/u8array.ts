import {AbstractTypeSpec, ReadResult} from '~/lib/go/types/spec';
import { Uint8} from '~/lib/go/types/basic';

/**
 * UInt8ArrayTypeSpec implements a primitive array of uint8/byte values.
 *
 * This spec introduces less overhead than using regular ArrayTypeSpec.
 */
export class UInt8ArrayTypeSpec extends AbstractTypeSpec<Uint8Array> {
  private readonly _length;

  constructor(length: number) {
    super(
      `[${length}]${Uint8.name}`,
      Uint8.size * length,
      Uint8.alignment,
      0
    );

    if (length < 0) {
      throw new Error(`${this.constructor.name}: array item count should be greater than zero`);
    }

    this._length = length;
  }

  get elemType() {
    return Uint8;
  }

  get length() {
    return this._length;
  }

  get alignment() {
    return Uint8.alignment;
  }

  alignAddress(addr: number): number {
    return Uint8.alignAddress(addr);
  }

  read(view: DataView, addr: number, buff: ArrayBufferLike): ReadResult<Uint8Array> {
    const offset = Uint8.alignAddress(addr);
    const endOffset = offset + Uint8.size * this._length;
    const value = new Uint8Array(buff, offset, this._length);
    return {
      address: offset,
      endOffset,
      value
    };
  }

  write(view: DataView, addr: number, val: Uint8Array, buff: ArrayBufferLike) {
    if (!(val instanceof Uint8Array)) {
      throw new Error(
        `${this.constructor.name}.write: value should be Uint8Array (got: ${val['constructor']['name']})`
      );
    }

    if (val.length > this._length) {
      // Still allow arrays that are smaller than source array.
      throw new Error(
        `${this.constructor.name}.write: source array is too big (got: ${val.length}, max: ${this._length})`
      );
    }

    const offset = Uint8.alignAddress(addr);
    const endOffset = offset + Uint8.size * this._length;
    new Uint8Array(buff).set(val, offset);
    return {
      address: offset,
      endOffset,
    }
  }

  encode(view, addr, val) {
    throw new Error(`${this.constructor.name}.encode: not supported, use write() instead`);
  }

  decode(view, addr): Uint8Array {
    throw new Error(`${this.constructor.name}.decode: not supported, use read() instead`);
  }
}
