export const alignAddr = (addr, align) => ((addr + align - 1) / align) * align;

export const Sizeof = {
  INT32: 4,
  INT64: 8
}
