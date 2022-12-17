import { StructTypeSpec } from './complex/struct.mjs';
import { ArrayTypeSpec } from './complex/array.mjs';

export * from './complex/pointer.mjs';
export * from './complex/slice.mjs';
export * from './basic/types.mjs';
export * from './common.mjs';

/**
 * Returns a new struct type
 *
 * @param {string} name
 * @param {AttributeDescriptor[]} attrs
 * @returns {StructTypeSpec}
 */
export const Struct = (name, attrs) => (
  new StructTypeSpec(name, attrs)
);

/**
 * Returns a new array type
 *
 * @param {AbstractTypeSpec} elem Array element type
 * @param {number} length Array length
 * @returns {ArrayTypeSpec}
 * @constructor
 */
export const ArrayOf = (elem, length) => (
  new ArrayTypeSpec(elem, length)
);
