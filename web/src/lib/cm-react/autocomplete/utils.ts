import type { Text } from '@codemirror/state'

import type { CursorPosition } from './types'

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n))

export const cursorFromOffset = (doc: Text, offset: number): CursorPosition => {
  const safeOffset = clamp(offset, 0, doc.length)
  const line = doc.lineAt(safeOffset)
  return {
    offset: safeOffset,
    lineNumber: line.number,
    column: safeOffset - line.from + 1,
  }
}

export const offsetFromLineColumn = (doc: Text, lineNumber: number, column: number): number => {
  const safeLineNumber = clamp(lineNumber, 1, doc.lines)
  const line = doc.line(safeLineNumber)
  const safeColumn = clamp(column, 1, line.length + 1)
  return line.from + safeColumn - 1
}

export const wordRangeAtOffset = (doc: Text, offset: number) => {
  const line = doc.lineAt(offset)
  const linePos = offset - line.from
  const text = line.text

  let start = linePos
  let end = linePos
  while (start > 0 && /\w/.test(text[start - 1])) {
    start--
  }

  while (end < text.length && /\w/.test(text[end])) {
    end++
  }

  return {
    lineNumber: line.number,
    from: line.from + start,
    to: line.from + end,
    startColumn: start + 1,
    endColumn: end + 1,
  }
}

export const stripSlash = (str: string) => (str[0] === '/' ? str.slice(1) : str)

export const textInRange = (source: string, from: number, to: number) => {
  if (from < 0 || to < from || to > source.length) {
    return ''
  }

  return source.slice(from, to)
}
