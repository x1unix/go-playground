import { hex } from '../common';
import {AbstractTypeSpec} from "~/lib/go/types/spec";

/**
 * StackWriter provides functionality for writing data to Go stack frame.
 */
export class StackWriter {
  private readonly _debug: boolean;
  private readonly _mem: DataView;
  private _offset = 0;
  private _retCount = 0;

  /**
   *
   * @param {DataView} mem
   * @param {number} sp
   * @param {boolean} debug
   */
  constructor(mem: DataView, sp: number, debug = false) {
    this._mem = mem;
    this._offset = sp;
    this._debug = debug;
  }

  get offset() {
    return this._offset;
  }

  /**
   * Skip n bytes
   */
  skip(count: number) {
    this._offset += count;
  }

  /**
   * Push a value
   */
  write<T=any>(typeSpec: AbstractTypeSpec, data: T): StackWriter {
    if (!typeSpec) {
      throw new ReferenceError('StackReader.pop: missing type reader');
    }

    const { address, endOffset } = typeSpec.write(
      this._mem, this._offset, data, this._mem.buffer
    );

    this._offset = endOffset;
    this._retCount++;

    if (this._debug) {
      console.log(`Ret: R${this._retCount} (*${typeSpec.name})(${hex(address)})`, data);
    }

    return this;
  }
}
