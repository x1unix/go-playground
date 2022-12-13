const pad = (str, count, isLeft=false, char=' ') => {
  if (str.length >= count) {
    return str;
  }

  const padding = char.repeat(count - str.length);
  return isLeft ? padding + str : str + padding;
}

const padRight = (str, count, char = ' ') => pad(str, count, false, char);
const padLeft = (str, count, char = ' ') => pad(str, count, true, char);
const whitespaceChars = new Set([
  '\n'
  ,'\t'
  ,'\r'
  ,'\f'
  ,'\v'
  ,'\u00a0'
  ,'\u1680'
  ,'\u2000'
  ,'\u200a'
  ,'\u2028'
  ,'\u2029'
  ,'\u202f'
  ,'\u205f'
  ,'\u3000'
  ,'\ufeff'
].map(s => s.charCodeAt(0)))

const WHITESPACE_PLACEHOLDER = 'W'.charCodeAt(0);
const ZERO_CHAR_PLACEHOLDER = '・'.charCodeAt(0);
const ROW_SEPARATOR = '｜';

export default class MemoryInspector {
  /**
   * @param mem {DataView}
   */
  constructor(mem) {
    this._mem = mem;
  }

  /**
   *
   * @param instance {WebAssembly.Instance}
   */
  static fromInstance(instance) {
    const view = new DataView(instance.exports.mem.buffer);
    return new MemoryInspector(view);
  }

  /**
   *
   * @param {number} offset
   * @param {number} count
   * @param {number} colCount
   */
  dump(offset, count, colCount=8) {
    count = count < colCount ? colCount : count;
    let rowCount = Math.floor(count / colCount);
    if (count % colCount > 0) {
      rowCount++;
    }

    let maxAddrLen = 0;
    let lines = [];
    for (let row = 0; row < rowCount; row++) {
      let rowOffset = offset + (row * colCount);
      /**
       * @type {number[]}
       */
      let bytes = [];
      for (let i = 0; i < colCount; i++) {
        const byte = this._mem.getUint8(rowOffset + i);
        bytes.push(byte)
      }

      const strAddr = rowOffset.toString(16);
      const hexBytes = bytes.map(b => padRight(b.toString(16), 2, '0')).join(' ');
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