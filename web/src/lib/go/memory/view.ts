import { type AbstractTypeSpec } from '~/lib/go/types/spec'
import { type DebugOptions, hex } from '~/lib/go/common'
import { type Ref, RefSlice, RefType } from '~/lib/go/pkg/syscall/js'
import { type JSValuesTable } from '~/lib/go/wrapper/interface'
import { MemoryInspector } from '~/lib/go/debug'

/**
 * MemoryView provides functionality to read or write into Go program memory.
 */
export class MemoryView {
  private readonly debug
  private memInspector: MemoryInspector
  constructor(
    private mem: WebAssembly.Memory,
    private readonly values: JSValuesTable,
    opts: DebugOptions = {},
  ) {
    this.debug = opts.debug ?? false
    this.memInspector = new MemoryInspector(this.mem)
  }

  get dataView() {
    return new DataView(this.mem.buffer)
  }

  get memory() {
    return this.mem
  }

  get inspector() {
    return this.memInspector
  }

  /**
   * Resets memory view using passed data view.
   * @param mem
   */
  reset(mem: WebAssembly.Memory) {
    this.mem = mem
    this.memInspector = new MemoryInspector(mem)
  }

  /**
   * Writes a value into memory.
   * Returns next address behind written value.
   *
   * Passed data will be marshaled using passed type specification.
   *
   * @param addr Destination address.
   * @param typeSpec Value type specification.
   * @param data Actual data.
   */
  write<T = any>(addr: number, typeSpec: AbstractTypeSpec, data: T): number {
    if (!typeSpec) {
      throw new ReferenceError('MemoryView.write: missing type reader')
    }

    const view = new DataView(this.mem.buffer)
    const { address, endOffset } = typeSpec.write(view, addr, data, this.mem.buffer)

    if (this.debug) {
      console.log(`MemWrite: (*${typeSpec.name})(${hex(address)})`, data)
    }

    return endOffset
  }

  /**
   * Copies contents from typed array into memory.
   *
   * @param address Target offset.
   * @param src Data source.
   */
  set(address: number, src: Uint8Array) {
    new Uint8Array(this.mem.buffer).set(src, address)
  }

  /**
   * Returns a chunk of bytes from memory of given size and offset.
   * Bytes can be returned as a copy or as a reference to original memory array (slice).
   *
   * @param address Offset
   * @param length Length
   * @param copy Return copy of data instead of reference to original memory.
   */
  get(address: number, length: number, copy = true) {
    if (!copy) {
      return new Uint8Array(this.mem.buffer, address, length)
    }

    return new Uint8Array(this.mem.buffer.slice(address, address + length))
  }

  /**
   * Reads and returns a value from memory by given address.
   *
   * Value will be unmarshal using passed type specification.
   *
   * @param addr Source address.
   * @param typeSpec Value type specification.
   */
  read<T = any>(addr: number, typeSpec: AbstractTypeSpec): T {
    if (!typeSpec) {
      throw new ReferenceError('MemoryView.read: missing type reader')
    }

    const view = new DataView(this.mem.buffer)
    const { value, address } = typeSpec.read(view, addr, this.mem.buffer)

    if (this.debug) {
      console.log(`Read: (*${typeSpec.name})(${hex(address)})`, value)
    }

    return value as T
  }

  /**
   * Reads a slice of `[]syscall/js.ref` and returns it as array of JS values.
   * @param addr
   */
  readRefSlice<T = any>(addr: number): T[] {
    const refsSlice = this.read<Ref[]>(addr, RefSlice)
    return refsSlice.map((ref) => ref.toValue(this.values)) as T[]
  }

  /**
   * Reads `syscall/js.ref` value and returns JS value referenced by it.
   * @param addr
   */
  readRef<T = any>(addr: number): T {
    const ref = this.read<Ref>(addr, RefType)
    return ref.toValue(this.values) as T
  }

  /**
   * Returns memory inspector from WebAssembly module instance.
   *
   * @param instance Module instance
   * @param jsVals JS values reference table
   * @param opts Debug options
   */
  static fromInstance(instance: WebAssembly.Instance, jsVals: JSValuesTable, opts?: DebugOptions) {
    const { mem } = instance.exports
    if (!mem) {
      throw new ReferenceError('Missing exported symbol "mem" in instance')
    }

    return new MemoryView(mem as WebAssembly.Memory, jsVals, opts)
  }
}
