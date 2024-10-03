import * as monaco from 'monaco-editor'

import { ImportClauseType, type ImportsContext } from '~/services/completion'

type Tokens = monaco.Token[][]

enum GoToken {
  None = '',
  Comment = 'comment.go',
  KeywordPackage = 'keyword.package.go',
  KeywordImport = 'keyword.import.go',
  Parenthesis = 'delimiter.parenthesis.go',
  Ident = 'identifier.go',
  String = 'string.go',
}

class ParseError extends Error {
  constructor(line: number, col: number, msg: string) {
    super(`Go parse error: ${msg} (at ${line}:${col})`)
  }
}

class UnexpectedTokenError extends ParseError {
  constructor(line: number, token: monaco.Token) {
    super(line, token.offset, `unexpected token "${token.type}`)
  }
}

const isNotEmptyToken = ({ type }: monaco.Token) => type !== GoToken.None

const findPackageBlock = (tokens: Tokens) => {
  for (let i = 0; i < tokens.length; i++) {
    const row = tokens[i]
    // Go file should start with package name.
    // Only whitespace or comment can be above package clause.

    // Find first non-empty token.
    const token = row.find(isNotEmptyToken)
    if (!token) {
      // Whitespace, skip
      continue
    }

    switch (token.type) {
      case GoToken.Comment:
        // comment, skip
        continue
      case GoToken.KeywordPackage:
        return i
      default:
        return -1
    }
  }

  return -1
}

interface ImportHeader {
  rowIndex: number
  hasOpenParen?: boolean
  argTokens?: monaco.Token[]
}

const findImportHeader = (offset: number, tokens: Tokens): ImportHeader | null => {
  for (let i = offset; i < tokens.length; i++) {
    const row = tokens[i]
    const j = row.findIndex(isNotEmptyToken)
    if (j === -1) {
      continue
    }

    const token = row[j]
    switch (token.type) {
      case GoToken.Comment:
        continue
      case GoToken.KeywordImport:
        break
      default:
        // not a comment
        return null
    }

    // Block is probably multiline if next token is parentheses or empty.
    const rest = row.slice(j + 1)
    const k = rest.findIndex(isNotEmptyToken)
    if (k === -1) {
      return { rowIndex: i }
    }

    switch (rest[k].type) {
      case GoToken.Parenthesis:
        return { rowIndex: i, hasOpenParen: true }
      case GoToken.Ident:
      case GoToken.String:
        // probably it's a single-line import.
        return {
          rowIndex: i,
          argTokens: rest.slice(k),
        }
      default:
        throw new UnexpectedTokenError(i, token)
    }
  }

  return null
}

const unquote = (str: string) => {
  if (!str.length) {
    return str
  }

  if (str[0] === '"') {
    str = str.slice(1)
  }

  const endPos = str.length - 1
  if (str[endPos] === '"') {
    str = str.slice(0, endPos)
  }
  return str
}

interface ReadTokenParams {
  line: number
  tokens: monaco.Token[]
  model: monaco.editor.ITextModel
}

const readToken = (index: number, { line, tokens, model }: ReadTokenParams): string => {
  const token = tokens[index]
  const endIdx = tokens[index + 1]?.offset
  const word = model.getLineContent(line + 1)
  if (!word || !token) {
    throw new ParseError(line, token.offset, 'parseToken: invalid range')
  }

  return word.slice(token.offset, endIdx)
}

const checkParenthesis = (index: number, params: ReadTokenParams) => {
  const { tokens } = params
  const isParen = tokens[index].type === GoToken.Parenthesis
  const value = readToken(index, params)

  const isClose = isParen && value === ')'
  return { isParen, isClose, value }
}

interface ImportBlock {
  range: monaco.IRange
  isMultiline?: boolean
  imports: ImportStmt[]
}

interface ImportStmt {
  alias?: string
  path: string
}

interface ImportRow {
  imports: ImportStmt[]
  closeParentPos: number
}

const readImportLine = (line: number, model: monaco.editor.ITextModel, row: monaco.Token[]): ImportStmt | null => {
  const i = row.findIndex(isNotEmptyToken)
  const token = row[i]
  const params: ReadTokenParams = {
    line,
    model,
    tokens: row,
  }
  switch (token.type) {
    case GoToken.Ident: {
      const ident = readToken(i, params)
      const restTokens = row.slice(i + 1)
      const pathPos = restTokens.findIndex(isNotEmptyToken)
      if (pathPos === -1) {
        throw new ParseError(line, i, 'missing import path after ident')
      }

      const importPath = readToken(pathPos, {
        ...params,
        tokens: restTokens,
      }).trim()

      return { alias: ident, path: unquote(importPath) }
    }
    case GoToken.String:
      return {
        path: unquote(readToken(i, params).trim()),
      }
    default:
      throw new UnexpectedTokenError(line, token)
  }
}

const readImportBlockLine = (line: number, model: monaco.editor.ITextModel, row: monaco.Token[]): ImportRow | null => {
  const imports: ImportStmt[] = []
  let slice = row
  let lastIdent: string | null = null
  while (slice.length > 0) {
    const i = slice.findIndex(isNotEmptyToken)
    if (i === -1) {
      break
    }

    const token = slice[i]
    const params: ReadTokenParams = {
      line,
      model,
      tokens: slice,
    }
    slice = slice.slice(i + 1)
    const { isParen, isClose, value } = checkParenthesis(i, params)
    if (isParen) {
      if (lastIdent) {
        throw new UnexpectedTokenError(line, token)
      }

      if (isClose) {
        // Group close on same line.
        return { imports, closeParentPos: token.offset }
      }

      throw new UnexpectedTokenError(line, token)
    }

    switch (token.type) {
      case GoToken.Ident: {
        if (lastIdent) {
          // import path expected
          throw new UnexpectedTokenError(line, token)
        }

        lastIdent = value
        // lastIdent = readToken(line, token, model)
        break
      }
      case GoToken.Comment: {
        break
      }
      case GoToken.String: {
        const path = unquote(value.trim())
        if (path) {
          imports.push(lastIdent ? { path, alias: lastIdent } : { path })
        }

        lastIdent = null
        break
      }
      default:
        // Unexpected token
        throw new UnexpectedTokenError(line, token)
    }
  }

  return { imports, closeParentPos: -1 }
}

const traverseImportGroup = (
  model: monaco.editor.ITextModel,
  header: ImportHeader,
  tokens: Tokens,
): ImportBlock | null => {
  let groupStartFound = header.hasOpenParen ?? false
  const imports: ImportStmt[] = []
  const range = {
    startLineNumber: header.rowIndex + 1,
    startColumn: 1,
    endLineNumber: -1,
    endColumn: -1,
  }

  for (let i = header.rowIndex + 1; i < tokens.length; i++) {
    const row = tokens[i]
    const j = row.findIndex(isNotEmptyToken)
    if (j === -1) {
      continue
    }

    const params: ReadTokenParams = {
      model,
      line: i,
      tokens: row,
    }

    const token = row[j]
    const { isParen, isClose } = checkParenthesis(j, params)
    if (isParen) {
      if (groupStartFound && isClose) {
        range.endLineNumber = i + 1
        range.endColumn = token.offset + 2
        return {
          range,
          imports,
          isMultiline: true,
        }
      }

      if (!groupStartFound && !isClose) {
        groupStartFound = true
        continue
      }

      throw new UnexpectedTokenError(i, token)
    }

    const r = readImportBlockLine(i, model, row)
    if (!r) {
      return null
    }

    imports.push(...r.imports)
    if (r.closeParentPos === -1) {
      continue
    }

    range.endLineNumber = i + 1
    range.endColumn = r.closeParentPos + 2
    return {
      range,
      imports,
      isMultiline: true,
    }
  }

  throw new ParseError(header.rowIndex, 1, 'unterminated import block')
}

const findImportBlock = (offset: number, model: monaco.editor.ITextModel, tokens: Tokens): ImportBlock | null => {
  const header = findImportHeader(offset, tokens)
  if (!header) {
    return null
  }

  if (!header.argTokens) {
    // multi-line
    return traverseImportGroup(model, header, tokens)
  }

  // single line import
  const importStmt = readImportLine(header.rowIndex, model, header.argTokens)
  if (!importStmt) {
    // syntax error.
    return null
  }

  // monaco lines start at 1
  const lineNo = header.rowIndex + 1
  return {
    range: {
      startLineNumber: lineNo,
      endLineNumber: lineNo,
      startColumn: 1,
      endColumn: model.getLineLength(lineNo) + 1,
    },
    imports: [importStmt],
  }
}

/**
 * Gathers information about Go imports in a model and provides information necessary for auto-import for suggestions.
 */
export const buildImportContext = (model: monaco.editor.ITextModel): ImportsContext => {
  const tokens = monaco.editor.tokenize(model.getValue(), model.getLanguageId())
  return importContextFromTokens(model, tokens)
}

/**
 * Builds import context from raw tokenized source and model.
 *
 * This is a workaround function for vitest as Monaco language pack can't be loaded in jsdom env.
 *
 * Regular users should use `buildImportContext` instead.
 */
export const importContextFromTokens = (model: monaco.editor.ITextModel, tokens: monaco.Token[][]): ImportsContext => {
  const packagePos = findPackageBlock(tokens)
  if (packagePos === -1) {
    // Invalid syntax, discard any import suggestions.
    return {
      blockType: ImportClauseType.None,
    }
  }

  // Fallback insert range for imports.
  const packageLine = packagePos + 1
  const packageEndCol = model.getLineLength(packageLine) + 1
  const fallbackRange: monaco.IRange = {
    startLineNumber: packageLine,
    endLineNumber: packageLine,
    startColumn: packageEndCol,
    endColumn: packageEndCol,
  }

  const allImports: string[] = []
  let hasError = false
  let lastImportBlock: ImportBlock | null = null

  let offset = packagePos + 1
  while (offset < tokens.length) {
    try {
      const block = findImportBlock(offset, model, tokens)
      if (!block) {
        break
      }

      // returned line starts from 1, keep as is as we count from 0.
      offset = block.range.endLineNumber
      // offset = block.range.endLineNumber + (block.isMultiline ? 0 : 1)
      // offset = block.range.endLineNumber + 1
      lastImportBlock = block
      allImports.push(...block.imports.map(({ path }) => path))
    } catch (err) {
      hasError = true
      break
    }
  }

  if (lastImportBlock) {
    // TODO: support named imports
    return {
      hasError,
      // prependNewLine: lastImportBlock.isMultiline,
      allPaths: new Set(allImports),
      blockPaths: lastImportBlock.imports.map(({ path }) => path),
      blockType: lastImportBlock.isMultiline ? ImportClauseType.Block : ImportClauseType.Single,
      range: lastImportBlock.range,
      totalRange: {
        startLineNumber: packageLine,
        endLineNumber: lastImportBlock.range.endLineNumber,
      },
    }
  }

  if (hasError) {
    // syntax error at first import block, skip
    return {
      hasError,
      blockType: ImportClauseType.None,
    }
  }

  const importCtx: ImportsContext = {
    blockType: ImportClauseType.None,
    range: fallbackRange,
    prependNewLine: true,
    totalRange: {
      startLineNumber: packageLine,
      endLineNumber: packageLine + 1,
    },
  }

  // No imports, figure out if there is an empty line after package clause.
  const nextLine = tokens[packagePos + 1]
  if (nextLine && nextLine.findIndex(isNotEmptyToken) === -1) {
    // line starts at 1.
    const lineNo = packagePos + 2
    const colNo = model.getLineLength(lineNo) + 1
    importCtx.prependNewLine = false
    importCtx.range = {
      startLineNumber: lineNo,
      endLineNumber: lineNo,
      startColumn: colNo,
      endColumn: colNo,
    }
  }

  return importCtx
}
