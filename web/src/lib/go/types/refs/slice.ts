import { GoStringType } from "./string";
import { AbstractTypeSpec } from "../spec";
import { AttributeDescriptor, StructTypeSpec, ArrayTypeSpec } from "../complex";
import { Bool, Int, Int32, Int64, Uint, Uint32, Uint64, UintPtr } from "../basic";

const sliceHeaderAttrs: AttributeDescriptor[] = [
  { key: 'data', type: UintPtr },
  { key: 'len', type: Int },
  { key: 'cap', type: Int }
];

export const SliceHeaderType = new StructTypeSpec(
  'reflect.SliceHeader', sliceHeaderAttrs
);

/**
 * SliceHeader represents a `reflect.SliceHeader` Go structure.
 */
export interface SliceHeader {
  /**
   * Array pointer
   */
  data: number

  /**
   * Slice length
   */
  len: number

  /**
   * Slice capacity
   */
  cap: number
}

/**
 * Represents a `[]T` Go slice struct reader.
 *
 * Returns an array of items during decode.
 */
class SliceTypeSpec<T=number> extends StructTypeSpec<SliceHeader> {
  constructor(private elemType: AbstractTypeSpec) {
    super(`[]${elemType.name}`, sliceHeaderAttrs)
  }

  protected valueFromStruct(buff: ArrayBufferLike, header: SliceHeader): T[] {
    let { data, len } = header;
    if (!data || !len) {
      return [] as T[];
    }

    let t = new ArrayTypeSpec(this.elemType, len);
    const { value } = t.read(new DataView(buff), data, buff);
    return value as T[];
  }
}

/**
 * Constructs a new slice type.
 * @param itemType Slice item type
 * @constructor
 */
export const SliceOf = <T=number>(itemType: AbstractTypeSpec) => (
  new SliceTypeSpec<T>(itemType)
);

export const StringSlice = SliceOf<string>(GoStringType);
export const IntSlice = SliceOf<number>(Int);
export const Int32Slice = SliceOf<number>(Int32);
export const Int64Slice = SliceOf<number>(Int64);
export const UintSlice = SliceOf<number>(Uint);
export const Uint32Slice = SliceOf<number>(Uint32);
export const Uint64Slice = SliceOf<number>(Uint64);
export const UintPtrSlice = SliceOf<number>(UintPtr);
export const BoolSlice = SliceOf<boolean>(Bool);
