import { AbstractTypeSpec } from '../spec'

export interface AttributeDescriptor {
  key: string
  type: AbstractTypeSpec
}

export class StructTypeSpec<T = object> extends AbstractTypeSpec {
  private readonly _attributes: AttributeDescriptor[]
  private readonly _firstAttr: AbstractTypeSpec

  /**
   *
   * @param name Struct name
   * @param {AttributeDescriptor[]} attrs attribute descriptors
   */
  constructor(name: string, attrs: AttributeDescriptor[]) {
    super(name, 0, 0, 0)

    if (attrs.length === 0) {
      throw new ReferenceError(`${this.constructor.name}: missing struct attributes`)
    }

    const [firstElem] = attrs
    const totalSize = attrs.map(({ type }) => type.size + type.padding).reduce((total, size) => total + size, 0)

    this.setTypeDescriptor({
      size: totalSize,
      alignment: firstElem.type.alignment,
      padding: 0,
    })

    this._attributes = attrs
    this._firstAttr = firstElem.type
  }

  get alignment() {
    return this._firstAttr.alignment
  }

  alignAddress(addr) {
    return this._firstAttr.alignAddress(addr)
  }

  read(view, addr, buff: ArrayBufferLike) {
    const address = this._firstAttr.alignAddress(addr)
    let offset = address

    const entries: Array<[string, any]> = []
    for (const attr of this._attributes) {
      const { key, type } = attr
      const fieldAddr = type.alignAddress(offset)
      const { value, endOffset } = type.read(view, fieldAddr, buff)
      entries.push([key, value])
      offset = endOffset
    }

    const structObj = Object.fromEntries(entries) as T
    return {
      address,
      endOffset: offset,
      value: this.valueFromStruct(buff, structObj),
    }
  }

  write(view, addr, val, buff: ArrayBufferLike) {
    const address = this._firstAttr.alignAddress(addr)
    let offset = address
    if (typeof val !== 'object') {
      throw new ReferenceError(
        `${this.constructor.name}.write: invalid value passed (${typeof val} ${val}). ` +
          `Value should be an object with attributes (${this._attributes.map((a) => a.key).join(', ')}) ` +
          `(struct ${this.name})`,
      )
    }

    for (const attr of this._attributes) {
      const { key, type } = attr
      if (!(key in val)) {
        throw new ReferenceError(
          `${this.constructor.name}.write: missing object property "${key}" (struct ${this.name})`,
        )
      }

      const fieldAddr = type.alignAddress(offset)
      const { endOffset } = type.write(view, fieldAddr, val[key], buff)
      offset = endOffset
    }

    return {
      address,
      endOffset: offset,
    }
  }

  /**
   * Returns an original value from struct.
   *
   * This method can be overloaded to return an original value
   * pointed by an original struct.
   *
   * This is useful for obtaining an original slice or string contents
   * from `reflect.StringHeader` or `reflect.SliceHeader` structs.
   *
   * @param buff Raw memory buffer
   * @param structVal original struct value
   * @protected
   */
  protected valueFromStruct(buff: ArrayBufferLike, structVal: T): any {
    return structVal
  }

  encode(view, addr, val) {
    throw new Error(`${this.constructor.name}.encode: not supported, use write() instead`)
  }

  decode(view, addr) {
    throw new Error(`${this.constructor.name}.decode: not supported, use read() instead`)
  }
}

/**
 * Constructs a new struct type
 * @param name Struct type name
 * @param fields Array of field definitions
 * @constructor
 */
export const Struct = <T = object>(name: string, fields: AttributeDescriptor[]) => new StructTypeSpec<T>(name, fields)
