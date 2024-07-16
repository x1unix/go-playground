import { alignAddr } from '~/lib/go/types/common'

export interface WriteResult {
  address: number
  endOffset: number
}

export interface ReadResult<T = any> extends WriteResult {
  value: T
}

export interface TypeDescriptor {
  size: number
  alignment: number
  padding: number
}

/**
 * Base class for type read and write implementation.
 *
 * @abstract
 */
export abstract class AbstractTypeSpec<T = any> {
  private _size = 0
  private _align = 1
  private _skip = 0
  private readonly _name: string = ''

  /**
   * @param name Original type name.
   * @param size Type size.
   * @param align Type alignment.
   * @param skip Number of bytes to skip.
   */
  protected constructor(name: string, size: number, align = 1, skip = 0) {
    this._size = size
    this._align = align
    this._skip = skip
    this._name = name
  }

  protected setTypeDescriptor({ size, alignment, padding }: TypeDescriptor) {
    this._size = size
    this._align = alignment
    this._skip = padding
  }

  /**
   * Number of bytes reserved after value contents.
   * @returns {number}
   */
  get padding() {
    return this._skip
  }

  /**
   * Returns value type size.
   * @returns {number}
   */
  get size() {
    return this._size
  }

  /**
   * @type {string}
   */
  get name() {
    return this._name
  }

  /**
   * Returns type alignment
   * @returns {number}
   */
  get alignment() {
    return this._align
  }

  /**
   * Align pointer address
   * @param addr
   * @returns Aligned address
   */
  alignAddress(addr: number): number {
    if (addr % this._align === 0) {
      // Address is aligned
      return addr
    }

    return alignAddr(addr, this._align)
  }

  /**
   * Decodes a value from DataView at passed address and returns a value.
   * Passed address should be aligned.
   *
   * Please consider `read()` for general-purpose use.
   *
   * @abstract
   * @param view Memory view
   * @param addr Address
   * @returns {*}
   */
  decode(view: DataView, addr: number): T {
    throw new Error(`${this.constructor.name}.decode: not implemented`)
  }

  /**
   * Encodes and puts value to DataView at passed address.
   * Passed address should be aligned.
   *
   * Please consider `write()` for general-purpose use.
   *
   * @abstract
   * @param view Memory view
   * @param addr Address
   * @param {*} val
   */
  encode(view: DataView, addr: number, val: T) {
    throw new Error(`${this.constructor.name}.encode: not implemented`)
  }

  /**
   * Reads value at specified offset in memory and returns
   * a value with end offset address.
   *
   * Passed offset address will be aligned before read.
   *
   * @param view Memory
   * @param addr Stack pointer
   * @param buff Original memory buffer
   * @returns {ReadResult}
   */
  read(view: DataView, addr: number, buff: ArrayBufferLike): ReadResult<T> {
    const address = this.alignAddress(addr)
    const value = this.decode(view, address)
    return {
      value,
      address,
      endOffset: address + this.size + this.padding,
    }
  }

  /**
   * Encodes and writes a value to DataView at specifying address.
   * Passed address will be aligned before write.
   *
   * @param view
   * @param addr
   * @param val
   * @param buff Original memory buffer
   * @returns {WriteResult}
   */
  write(view: DataView, addr: number, val: T, buff: ArrayBufferLike): WriteResult {
    const address = this.alignAddress(addr)
    this.encode(view, address, val)
    return {
      address,
      endOffset: address + this.size + this.padding,
    }
  }
}
