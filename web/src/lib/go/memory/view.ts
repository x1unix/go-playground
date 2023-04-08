import {AbstractTypeSpec} from '~/lib/go/types/spec';
import {DebugOptions, hex} from '~/lib/go/common';
import {Ref, RefSlice, RefType} from "~/lib/go/pkg/syscall/js";
import {JSValuesTable} from "~/lib/go/wrapper/interface";

type TypedArray =
  Uint8Array | Uint16Array | Uint32Array | Int8Array | Int16Array | Int32Array

/**
 * MemoryView provides functionality to read or write into Go program memory.
 */
export class MemoryView {
  private readonly debug;
  constructor(
    private mem: DataView,
    private values: JSValuesTable,
    opts: DebugOptions = {}
  ) {
    this.debug = opts.debug ?? false;
  }

  get dataView() {
    return this.mem;
  }

  get memory() {
    return this.mem.buffer;
  }

  /**
   * Resets memory view using passed data view.
   * @param mem
   */
  reset(mem: DataView) {
    this.mem = mem;
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
  write<T=any>(addr: number, typeSpec: AbstractTypeSpec, data: T): number {
    if (!typeSpec) {
      throw new ReferenceError('MemoryView.write: missing type reader');
    }

    const { address, endOffset } = typeSpec.write(
      this.mem, addr, data, this.mem.buffer
    );

    if (this.debug) {
      console.log(`MemWrite: (*${typeSpec.name})(${hex(address)})`, data);
    }

    return endOffset;
  }

  /**
   * Copies contents from typed array into memory.
   *
   * @param address Target offset.
   * @param src Data source.
   */
  set(address: number, src: Uint8Array) {
    new Uint8Array(this.mem.buffer).set(src, address);
  }

  /**
   * Returns a reference to a chunk of memory of given size and offset.
   *
   * @param address Offset
   * @param length Length
   */
  get(address: number, length: number) {
    return new Uint8Array(this.mem.buffer, address, length);
  }

  /**
   * Reads and returns a value from memory by given address.
   *
   * Value will be unmarshal using passed type specification.
   *
   * @param addr Source address.
   * @param typeSpec Value type specification.
   */
  read<T=any>(addr: number, typeSpec: AbstractTypeSpec): T {
    if (!typeSpec) {
      throw new ReferenceError('MemoryView.read: missing type reader');
    }

    const { value, address } = typeSpec.read(
      this.mem, addr, this.mem.buffer
    );

    if (this.debug) {
      console.log(`Read: (*${typeSpec.name})(${hex(address)})`, value);
    }

    return value as T;
  }

  /**
   * Reads a slice of `[]syscall/js.ref` and returns it as array of JS values.
   * @param addr
   */
  readRefSlice<T=any>(addr: number): T[] {
    const refsSlice = this.read<Ref[]>(addr, RefSlice);
    return refsSlice.map(ref => ref.toValue(this.values)) as T[];
  }

  /**
   * Reads `syscall/js.ref` value and returns JS value referenced by it.
   * @param addr
   */
  readRef<T=any>(addr: number): T {
    const ref = this.read<Ref>(addr, RefType);
    return ref.toValue(this.values) as T;
  }

  /**
   * Returns memory inspector from WebAssembly module instance.
   *
   * @param instance Module instance
   * @param jsVals JS values reference table
   * @param opts Debug options
   */
  static fromInstance(instance: WebAssembly.Instance, jsVals: JSValuesTable, opts?: DebugOptions) {
    const { mem } = instance.exports;
    const buffer = mem['buffer'] as ArrayBufferLike;
    if (!buffer) {
      throw new ReferenceError('Missing exported symbol "buffer" in instance');
    }

    const view = new DataView(buffer);
    return new MemoryView(view, jsVals, opts);
  }

}
