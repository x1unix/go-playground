import { hex } from './common.mjs';
import StackWriter from './StackWriter.mjs';

const STACK_SKIP_COUNT = 8;

/**
 * Provides functionality for reading data from Go stack frame.
 */
export default class StackReader {
  _addr = 0;
  _popCount = 0;
  _debug = false;
  _finished = false;

  /**
   *
   * @param {DataView} mem Memory
   * @param {number} sp Stack pointer address
   * @param {Object} opts options
   */
  constructor(mem, sp, opts = {}) {
    /**
     * @type DataView
     * @private
     */
    this._mem = mem;
    this._addr = sp;
    this._debug = opts.debug;
  }

  get addr() {
    return this._addr;
  }

  /**
   * Skip n bytes
   * @param {number} count
   */
  skip(count) {
    this._addr += count;
  }

  /**
   * Skip first reserved 8 bytes of stack.
   * @returns {number}
   */
  skipHeader() {
    if (this._popCount > 0) {
      throw new Error('StackReader.skipHeader: should be called once');
    }

    this._addr += STACK_SKIP_COUNT;
  }

  /**
   * Pops a value from stack using value spec.
   *
   * @param {AbstractTypeSpec} typeSpec
   * @returns {*}
   */
  pop(typeSpec) {
    if (!typeSpec) {
      throw new ReferenceError('StackReader.pop: missing type reader');
    }

    if (this._finished) {
      throw new Error('StackReader.pop: cannot be called after writer()');
    }

    // TODO: move alignment logic to AbstractTypeSpec
    const {address, delta} = typeSpec.alignAddress(this._addr);
    const value = typeSpec.read(this._mem, address);
    this._addr += delta + typeSpec.size;

    if (this._debug) {
      console.log([
        `Pop: $${this._popCount}`,
        `(*${typeSpec.type})(${hex(address)})`,
        value,
      ].join(' '))
    }

    this._popCount++;
    return value;
  }

  /**
   * Pop an array
   * @param {AbstractTypeSpec} typeSpec
   * @param {number} count
   * @returns {*}
   */
  popTimes(typeSpec, count) {
    const results = [];
    for (let i = 0; i < count; i++) {
      results.push(this.pop(typeSpec));
    }

    return results;
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
    return new StackWriter(this._mem, this._addr, this._debug);
  }
}