import { whitespaceChars, padRight } from './utils'

const WHITESPACE_PLACEHOLDER = 'W'.charCodeAt(0)
const ZERO_CHAR_PLACEHOLDER = '・'.charCodeAt(0)
const ROW_SEPARATOR = '｜'

export class MemoryInspector {
  constructor(private readonly mem: WebAssembly.Memory) {}

  /**
   * Returns memory inspector from WebAssembly module instance.
   *
   * @param instance Module instance
   */
  static fromInstance(instance: WebAssembly.Instance) {
    const { mem } = instance.exports
    if (!mem) {
      throw new ReferenceError('Missing exported symbol "buffer" in instance')
    }

    return new MemoryInspector(mem as WebAssembly.Memory)
  }

  dump(offset: number, count: number, colCount = 8) {
    const view = new DataView(this.mem.buffer)

    count = count < colCount ? colCount : count
    let rowCount = Math.floor(count / colCount)
    if (count % colCount > 0) {
      rowCount++
    }

    let maxAddrLen = 0
    const lines: Array<[string, string, string]> = []
    for (let row = 0; row < rowCount; row++) {
      const rowOffset = offset + row * colCount
      const bytes: number[] = []
      for (let i = 0; i < colCount; i++) {
        const byte = view.getUint8(rowOffset + i)
        bytes.push(byte)
      }

      const strAddr = rowOffset.toString(16)
      const hexBytes = bytes.map((b) => padRight(b.toString(16), 2, '0')).join(' ')

      const strBytes = String.fromCharCode(
        ...bytes
          .map((b) => (whitespaceChars.has(b) ? WHITESPACE_PLACEHOLDER : b))
          .map((b) => (b === 0 ? ZERO_CHAR_PLACEHOLDER : b)),
      )
      lines.push([strAddr, hexBytes, strBytes])
      if (maxAddrLen < strAddr.length) {
        maxAddrLen = strAddr.length
      }
    }

    return lines
      .map(([addr, bytes, str]) => `${padRight(addr, maxAddrLen)} ${ROW_SEPARATOR} ${bytes} ${ROW_SEPARATOR} ${str}`)
      .join('\n')
  }
}
