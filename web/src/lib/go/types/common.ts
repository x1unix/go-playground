/**
 * Aligns memory address using provided alighment
 * @param addr Address
 * @param align Alignment
 */
export const alignAddr = (addr: number, align: number) => (
  ((addr + align - 1) / align) * align
);
