import { AbstractTypeSpec } from "~/lib/go/types/spec";
import { StructTypeSpec } from "~/lib/go/types/complex/struct";
import { ArrayTypeSpec } from "~/lib/go/types/complex/array";
import { Int, UintPtr } from "~/lib/go/types/basic";

export const SliceHeaderType = new StructTypeSpec('reflect.SliceHeader', [
  { key: 'data', type: UintPtr },
  { key: 'len', type: Int },
  { key: 'cap', type: Int }
]);

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
 * Returns an array from slice header.
 * Returns null if underlying array pointer is zero.
 *
 * See Go `reflect.SliceHeader` struct.
 *
 * @param view Go memory
 * @param elemType Array element type
 * @param header Slice header
 */
export const readSlice = <T=any>(view: DataView, elemType: AbstractTypeSpec, header: SliceHeader): T[]|null => {
  const { data, len } = header;
  if (!data) {
    return null;
  }

  if (!len) {
    return [];
  }

  const typeReader = new ArrayTypeSpec(elemType, len);
  const { value } = typeReader.read(view, data);
  return value as T[];
}
