import { hex, type DebugOptions } from '../common'
import { type AbstractTypeSpec } from '../types/spec'
import { type JSValuesTable } from '../wrapper/interface'
import { StackWriter } from './writer'
import { type Ref, RefType, RefSlice } from '../pkg/syscall/js'

const STACK_SKIP_COUNT = 8

/**
 * Provides functionality for reading data from Go stack frame.
 */
export class StackReader {
  private _offset = 0
  private _initialOffset = 0
  private _popCount = 0
  private readonly _debug = false
  private _finished = false
  private readonly _mem: DataView
  private readonly _values: JSValuesTable

  /**
   *
   * @param mem Memory
   * @param values JS values table
   * @param sp Stack pointer address
   * @param opts options
   */
  constructor(mem: DataView, values: JSValuesTable, sp: number, opts: DebugOptions = {}) {
    /**
     * @type DataView
     * @private
     */
    this._mem = mem
    this._offset = sp
    this._values = values
    this._initialOffset = sp
    this._debug = opts.debug ?? false
  }

  get dataView() {
    return this._mem
  }

  get addr() {
    return this._offset
  }

  /**
   * Replaces original stack pointer address
   * with passed value but keeping stack offset (sp + offset).
   *
   * @param newSp New stack pointer
   */
  updateStackPointer(newSp: number) {
    if (newSp === this._initialOffset) {
      return
    }

    const delta = this._offset - this._initialOffset
    const newOffset = newSp + delta

    if (this._debug) {
      console.log(
        [
          'Set SP:',
          `${hex(this._initialOffset)} -> ${hex(newSp)}`,
          `\t(offset: ${hex(this._offset)} -> ${hex(newOffset)}) (+${delta})`,
        ].join(' '),
      )
    }

    this._initialOffset = newSp
    this._offset = newOffset
  }

  /**
   * Skip n bytes
   * @param {number} count
   */
  skip(count) {
    this._offset += count
  }

  /**
   * Skip first reserved 8 bytes (BP) of stack.
   * @returns {number}
   */
  skipHeader() {
    if (this._popCount > 0) {
      throw new Error('StackReader.skipHeader: should be called once')
    }

    this._offset += STACK_SKIP_COUNT
  }

  /**
   * Sequentially read several values of the same type.
   * @param typeSpec Value type
   * @param count number of times to repeat
   */
  nextN<T = any>(typeSpec: AbstractTypeSpec, count: number): T[] {
    const results: any[] = []
    for (let i = 0; i < count; i++) {
      results.push(this.next(typeSpec))
    }

    return results
  }

  /**
   * Reads next value from stack using specified type.
   *
   * @param typeSpec Value type
   * @returns {*}
   */
  next<T = any>(typeSpec: AbstractTypeSpec): T {
    if (!typeSpec) {
      throw new ReferenceError('StackReader.pop: missing type reader')
    }

    if (this._finished) {
      throw new Error('StackReader.pop: cannot be called after writer()')
    }

    const { value, address, endOffset } = typeSpec.read(this._mem, this._offset, this._mem.buffer)
    this._offset = endOffset
    if (this._debug) {
      console.log(`Pop: $${this._popCount} (*${typeSpec.name})(${hex(address)})`, value)
    }

    this._popCount++
    return value as T
  }

  /**
   * Reads next `syscall/js.ref` argument and returns
   * JS value referenced by it.
   */
  nextRef<T = any>(): T {
    const ref = this.next<Ref>(RefType)
    return ref.toValue(this._values) as T
  }

  /**
   * Reads next `[]syscall/js.ref` slice and
   * returns array of JS values.
   */
  nextRefSlice<T = any>(): T[] {
    const refsSlice = this.next<Ref[]>(RefSlice)
    return refsSlice.map((ref) => ref.toValue(this._values)) as T[]
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
      throw new Error('StackReader.writer: method can be called only once')
    }
    this._finished = true
    return new StackWriter(this._mem, this._offset, this._debug)
  }
}
