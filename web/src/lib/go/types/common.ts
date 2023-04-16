/**
 * Aligns memory address using provided alignment
 *
 * @param addr Address
 * @param alignment Alignment
 */
export const alignAddr = (addr: number, alignment: number) => {
  // Calculate the offset required to align the address
  const offset = alignment - (addr % alignment);

  // Add the offset to the address to align it
  return addr + offset;
};
