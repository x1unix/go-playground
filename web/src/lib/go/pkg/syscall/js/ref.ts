import { SliceOf, Uint32 } from '../../../types'
import { type JSValuesTable } from '../../../wrapper/interface'
import { AbstractTypeSpec } from '~/lib/go/types/spec'

export const NAN_HEAD = 0x7ff80000

enum TypeFlag {
  Empty = 0,
  Object = 1,
  String = 2,
  Symbol = 3,
  Function = 4,
}

/**
 * Returns function type flag.
 * @param v
 */
const getTypeFlag = (v: any): TypeFlag => {
  switch (typeof v) {
    case 'object':
      return v === null ? TypeFlag.Empty : TypeFlag.Object
    case 'string':
      return TypeFlag.String
    case 'symbol':
      return TypeFlag.Symbol
    case 'function':
      return TypeFlag.Function
    default:
      return TypeFlag.Empty
  }
}

/**
 * RefKind is Ref type.
 */
export enum RefKind {
  /**
   * Invalid ref
   */
  Invalid,

  /**
   * Literal value
   */
  Value,

  /**
   * Reference to values table
   */
  ID,
}

/**
 * Ref is wrapper type around `syscall/js.ref` value.
 *
 * `js.ref` is a pointer to JavaScript value registered
 * in Go values mapping table (`Go._values`).
 */
export class Ref {
  /**
   * Ref constructor
   * @param kind Reference source type, used to decode JS value from reference.
   * @param ref Reference ID
   * @param data Extra data for write on encode.
   */
  constructor(
    public readonly kind: RefKind,
    public readonly ref: number = -1,
    public readonly data?: number[],
  ) {}

  /**
   * Returns a resolved JS value from ref.
   * @param values Values table
   */
  toValue(values: JSValuesTable) {
    switch (this.kind) {
      case RefKind.ID:
        return values[this.ref]
      case RefKind.Value:
        return this.ref
      default:
        return undefined
    }
  }

  /**
   * Creates a new writable Ref from value and ref ID.
   *
   * @param v Value
   * @param valId Ref ID
   */
  static fromValue(v: Exclude<any, Ref>, valId: number) {
    // Copied from `storeValue`.
    if (v instanceof Ref) {
      throw new Error(`Ref.fromValue: value is already a Ref (${v.ref})`)
    }

    if (typeof v === 'number' && v !== 0) {
      // See: storeValue - wasm_exec.js:129
      const kind = isNaN(v) ? RefKind.ID : RefKind.Value
      return new Ref(kind, valId, isNaN(v) ? [0, NAN_HEAD] : [v])
    }

    if (v === undefined) {
      return new Ref(RefKind.Value, valId, [0])
    }

    const typeFlag = getTypeFlag(v)
    const head = NAN_HEAD | typeFlag
    return new Ref(RefKind.ID, valId, [valId, head])
  }

  /**
   * Reports whenever value should be referenced
   * by values table or can be stored as Ref value.
   *
   * Used by writer to decide if necessary to allocate
   * a new ref id or not.
   *
   * @param v
   */
  static isReferenceableValue(v: Exclude<any, Ref>) {
    if (typeof v === 'number' && v !== 0) {
      return false
    }

    return v !== undefined
  }
}

class RefTypeSpec extends AbstractTypeSpec<Ref> {
  constructor() {
    super('syscall.js/ref', 8, 8, 0)
  }

  decode(view, addr): Ref {
    const value = view.getFloat64(addr, true)
    if (value === 0) {
      return new Ref(RefKind.Invalid)
    }

    if (!isNaN(value)) {
      return new Ref(RefKind.Value, value)
    }

    const id = view.getUint32(addr, true)
    return new Ref(RefKind.ID, id)
  }

  encode(view: DataView, addr: number, ref: Ref) {
    if (!ref.data?.length) {
      throw new Error(
        `${this.constructor.name}.encode: Ref value is not writable. ` +
          `Ref should be created using Ref.fromValue() method.`,
      )
    }

    // See: storeValue - wasm_exec.js:140
    const [high, low] = ref.data
    switch (ref.data.length) {
      case 1:
        view.setFloat64(addr, high, true)
        return
      case 2:
        view.setUint32(addr, high, true)
        view.setUint32(addr + Uint32.size, low, true)
        return
      default:
        throw new Error(`${this.constructor.name}.encode: invalid Ref data size: ${ref.data.length}`)
    }
  }
}

export const RefType = new RefTypeSpec()
export const RefSlice = SliceOf<Ref>(RefType)
