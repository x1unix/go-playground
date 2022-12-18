import { hex, DebugOptions } from '../common';
import { StackWriter } from "~/lib/go/stack/writer";
import {AbstractTypeSpec} from "~/lib/go/types/spec";

const STACK_SKIP_COUNT = 8;

/**
 * Provides functionality for reading data from Go stack frame.
 */
export class StackReader {
  private _offset = 0;
  private _popCount = 0;
  private _debug = false;
  private _finished = false;
  private _mem: DataView;

  /**
   *
   * @param mem Memory
   * @param sp Stack pointer address
   * @param opts options
   */
  constructor(mem, sp, opts: DebugOptions = {}) {
    /**
     * @type DataView
     * @private
     */
    this._mem = mem;
    this._offset = sp;
    this._debug = opts.debug ?? false;
  }

  get dataView() {
    return this._mem;
  }

  get addr() {
    return this._offset;
  }

  /**
   * Skip n bytes
   * @param {number} count
   */
  skip(count) {
    this._offset += count;
  }

  /**
   * Skip first reserved 8 bytes of stack.
   * @returns {number}
   */
  skipHeader() {
    if (this._popCount > 0) {
      throw new Error('StackReader.skipHeader: should be called once');
    }

    this._offset += STACK_SKIP_COUNT;
  }

  /**
   * Pop an array
   * @param typeSpec Value type
   * @param count number of times to repeat
   */
  popTimes<T=any>(typeSpec: AbstractTypeSpec, count: number): T[] {
    const results: any[] = [];
    for (let i = 0; i < count; i++) {
      results.push(this.pop(typeSpec));
    }

    return results;
  }

  /**
   * Pops a value from stack using value spec.
   *
   * @param typeSpec Value type
   * @returns {*}
   */
  pop<T=any>(typeSpec: AbstractTypeSpec): T {
    if (!typeSpec) {
      throw new ReferenceError('StackReader.pop: missing type reader');
    }

    if (this._finished) {
      throw new Error('StackReader.pop: cannot be called after writer()');
    }

    const { value, address, endOffset } = typeSpec.read(this._mem, this._offset);
    this._offset = endOffset;
    if (this._debug) {
      console.log(`Pop: $${this._popCount} (*${typeSpec.name})(${hex(address)})`, value);
    }

    this._popCount++;
    return value as T;
  }

  /**
   * Finish write and return stack frame writer.
   *
   * This method will lock stack frame for writing.
   *
   * @returns {StackWriter} Stack frame writer
   */
  writer() {
    if (this._finished) {
      throw new Error('StackReader.writer: method can be called only once');
    }
    this._finished = true;
    return new StackWriter(this._mem, this._offset, this._debug);
  }
}
