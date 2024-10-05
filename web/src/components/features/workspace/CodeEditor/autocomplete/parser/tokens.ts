import type * as monaco from 'monaco-editor'

export type Tokens = monaco.Token[][]

const keywordRegex = /keyword\.(\w+)\.go/i
const keywordValues = new Set([
  'bool',
  'true',
  'false',
  'uint8',
  'uint16',
  'uint32',
  'uint64',
  'int8',
  'int16',
  'int32',
  'int64',
  'float32',
  'float64',
  'complex64',
  'complex128',
  'byte',
  'rune',
  'uint',
  'int',
  'uintptr',
  'string',
])

export enum GoToken {
  None = '',
  Comment = 'comment.go',
  KeywordPackage = 'keyword.package.go',
  KeywordImport = 'keyword.import.go',
  Parenthesis = 'delimiter.parenthesis.go',
  Square = 'delimiter.square.go',
  Dot = 'delimiter.go',
  Ident = 'identifier.go',
  String = 'string.go',
  Number = 'number.go',
}

/**
 * Returns whether a passed token type is a document-able Go keyword.
 */
export const isKeywordValueToken = (tokenType: string) => {
  const m = keywordRegex.exec(tokenType)
  if (!m) {
    return false
  }

  const [, keyword] = m
  return keywordValues.has(keyword)
}

export const isNotEmptyToken = ({ type }: monaco.Token) => type !== GoToken.None

export const tokenByOffset = (tokens: monaco.Token[], offset: number, maxPos?: number) => {
  let left = 0
  let right = tokens.length - 1
  maxPos = maxPos ?? tokens[tokens.length - 1].offset

  while (left <= right) {
    const mid = Math.floor((left + right) / 2)
    const tok = tokens[mid]

    if (offset < tok.offset) {
      right = mid - 1
      continue
    }

    const j = mid + 1
    const end = j < tokens.length ? tokens[j].offset : maxPos
    if (offset >= tok.offset && offset < end) {
      return {
        tok,
        index: mid,
      }
    }

    left = mid + 1
  }

  return null
}

export const tokenToString = (line: string, tokens: monaco.Token[], pos: number) => {
  const start = tokens[pos].offset
  if (pos === tokens.length - 1) {
    return line.slice(start)
  }

  const end = tokens[pos + 1].offset
  return line.slice(start, end)
}
