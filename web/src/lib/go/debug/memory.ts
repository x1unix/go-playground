import { whitespaceChars, padRight } from "./utils";

const WHITESPACE_PLACEHOLDER = 'W'.charCodeAt(0);
const ZERO_CHAR_PLACEHOLDER = '・'.charCodeAt(0);
const ROW_SEPARATOR = '｜';

export class MemoryInspector {
  private _mem: DataView;

  constructor(mem: DataView) {
    this._mem = mem;
  }

  /**
   * Returns memory inspector from WebAssembly module instance.
   *
   * @param instance Module instance
   */
  static fromInstance(instance: WebAssembly.Instance) {
    const { mem } = instance.exports;
    const buffer = mem['buffer'] as ArrayBufferLike;
    if (!buffer) {
      throw new ReferenceError('Missing exported symbol "buffer" in instance');
    }

    const view = new DataView(buffer);
    return new MemoryInspector(view);
  }

  dump(offset: number, count: number, colCount=8) {
    count = count < colCount ? colCount : count;
    let rowCount = Math.floor(count / colCount);
    if (count % colCount > 0) {
      rowCount++;
    }

    let maxAddrLen = 0;
    let lines: [string, string, string][] = [];
    for (let row = 0; row < rowCount; row++) {
      let rowOffset = offset + (row * colCount);
      let bytes: number[] = [];
      for (let i = 0; i < colCount; i++) {
        const byte = this._mem.getUint8(rowOffset + i);
        bytes.push(byte)
      }

      const strAddr = rowOffset.toString(16);
      const hexBytes = bytes
        .map(b => padRight(b.toString(16), 2, '0'))
        .join(' ');

      const strBytes = String.fromCharCode(...bytes
        .map(b => whitespaceChars.has(b) ? WHITESPACE_PLACEHOLDER : b)
        .map(b => b === 0 ? ZERO_CHAR_PLACEHOLDER : b)
      );
      lines.push([strAddr, hexBytes, strBytes]);
      if (maxAddrLen < strAddr.length) {
        maxAddrLen = strAddr.length;
      }
    }

    return lines.map(([addr, bytes, str]) => (
      `${padRight(addr, maxAddrLen)} ${ROW_SEPARATOR} ${bytes} ${ROW_SEPARATOR} ${str}`
    )).join('\n')
  }
}
