import { Sizeof } from './Types.mjs';

/**
 * @param {number} v
 * @returns {string}
 */
const hex = v => v.toString(16);

const STACK_SKIP_COUNT = 8;

export default class StackReader {
  _sp = 0;
  _offset = 0;
  _popCount = 0;
  _debug = false;

  constructor(mem, sp, opts = {}) {
    /**
     * @type DataView
     * @private
     */
    this._mem = mem;
    this._sp = sp;
    this._debug = opts.debug;
  }

  get offset() {
    return this._offset;
  }

  get addr() {
    return this._sp + this._offset;
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
   * Pops a value from stack using value spec.
   *
   * @param {AbstractTypeSpec} typeSpec
   * @returns {*}
   */
  pop(typeSpec) {
    if (!typeSpec) {
      throw new ReferenceError('StackReader.pop: missing type reader');
    }
    // console.log('pop', this._offset, hex(this._mem.getUint8(this._sp + this._offset)));

    const {address, delta} = typeSpec.alignAddress(this._sp + this._offset);
    const value = typeSpec.read(this._mem, address);
    this._offset += delta + typeSpec.size;

    if (this._debug) {
      console.log([
        `Pop: $${this._popCount}`,
        `(*${typeSpec.type})(${hex(address)})`,
        value,
        '\t\t'
      ].join(' '))
    }




    //
    // const startOffset = this._offset;
    // const addr = this._sp + this._offset;
    // const value = typeSpec.read(this._mem, addr);
    // const readCount = typeSpec.getAreaSize(addr);
    // this._offset += readCount;
    //
    // if (this._debug) {
    //   console.log(
    //     [
    //       `Pop: $${this._popCount}`,
    //       `(*${typeSpec.type})(${hex(addr)})`,
    //       `${value}`,
    //       '\t\t',
    //       `(${hex(startOffset)} -> ${hex(this._offset)})`,
    //       `+${readCount}`
    //     ].join(' ')
    //   );
    // }

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
}