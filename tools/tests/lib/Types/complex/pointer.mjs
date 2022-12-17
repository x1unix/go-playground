/**
 * Deference a pointer and return underlying value using passed type.
 *
 * Returns `null` when address is zero.
 *
 * @param {DataView} view Memory
 * @param {AbstractTypeSpec} elemType Element type
 * @param {number} addr Address
 */
export const readPointer = (view, elemType, addr) => {
  if (addr === 0) {
    return null;
  }

  const { value } = elemType.read(view, addr);
  return value;
}
