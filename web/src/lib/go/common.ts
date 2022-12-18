export const toHex = (v: number) => v.toString(16);
export const fromHex = (v: string) => parseInt(v, 16);

/**
 * Formats number to hex or parses number from hex string.
 * @param v
 */
export const hex = (v: number|bigint|string) => {
  switch (typeof v) {
    case 'number':
      return toHex(v);
    case 'bigint':
      return toHex(Number(v));
    case 'string':
      return fromHex(v);
    default:
      throw new Error(`hex: invalid argument type ${typeof v}`);
  }
}

export interface DebugOptions {
  debug?: boolean
}
