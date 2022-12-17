import { AbstractTypeSpec } from '../spec.mjs';
import { StructTypeSpec } from './struct.mjs';
import { ArrayTypeSpec } from './array.mjs';
import { Types } from '../basic/types.mjs';

export const SliceHeader = new StructTypeSpec('reflect.SliceHeader', [
  { key: 'data', type: Types.UintPtr },
  { key: 'len', type: Types.Int },
  { key: 'cap', type: Types.Int }
]);

/**
 * @typedef {Object} GoSliceHeader
 * @property {number} data Data pointer
 * @property {number} len Slice length
 * @property {number} cap Slice capacity
 */

/**
 * Returns an array from slice header.
 *
 * See Go `reflect.SliceHeader` struct.
 *
 * @see SliceHeader
 * @param {DataView} view
 * @param {AbstractTypeSpec} elemType
 * @param {GoSliceHeader} header
 * @returns Array|null
 */
export const readSlice = (view, elemType, header) => {
  const { data, len } = header;
  if (!data) {
    return null;
  }

  if (!len) {
    return [];
  }

  const typeReader = new ArrayTypeSpec(elemType, len);
  const { value } = typeReader.read(view, data);
  return value;
}
