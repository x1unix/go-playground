export const alignAddr = (addr, align) => ((addr + align - 1) / align) * align;

export const num2hex = val => typeof val === 'bigint' ? num2hex(Number(val)) : val.toString(16);
export const hex = v => typeof v === 'string' ? parseInt(v, 16) : num2hex(v);

export const Sizeof = {
  INT32: 4,
  INT64: 8
}
