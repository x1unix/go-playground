import * as monaco from 'monaco-editor'
import { GoToken, isExported, isKeywordValueToken, tokenByOffset, tokenToString } from '../parser/tokens'

const getLineTokens = (str: string, lang: string): monaco.Token[] | null => {
  try {
    const tokens = monaco.editor.tokenize(str, lang)
    return tokens[0]
  } catch (_) {
    return null
  }
}

const checkPackageNameToken = (tokens: monaco.Token[], tokenPos: number) => {
  let identPos = -1
  let foundIdent = false
  let foundDot = false

  // Ensure that there is no delimiters or identifiers behind
  // to ensure that it's a first identifier in a chain.
  //
  // Expected backward pattern is:
  //    <packageName>.
  //
  // Necessary to reject cases like:
  //  foo.bar.baz
  for (let i = tokenPos; i >= 0; i--) {
    const tok = tokens[i]
    switch (tok.type) {
      case GoToken.Dot:
        if (foundDot || foundIdent) {
          return -1
        }

        foundDot = true
        break
      case GoToken.None:
        if (foundIdent && foundDot) {
          return identPos
        }

        return -1
      case GoToken.Ident:
        if (foundIdent) {
          // twice ident
          return -1
        }

        foundIdent = true
        identPos = i
        break
      case GoToken.Parenthesis:
        return foundIdent ? identPos : -1
      default:
        // unexpected
        return -1
    }
  }

  return identPos
}

export interface HoverValue {
  packageName?: string
  value: string
  range: {
    startColumn: number
    endColumn: number
  }
}

/**
 * Resolves symbol query from a currently focused token.
 *
 * Returns null when identifier from a package is unexported (e.g `foo.bar`)
 */
const resolveHoverValue = (line: string, tokens: monaco.Token[], tokenPos: number): HoverValue | null => {
  const hoverValue = tokenToString(line, tokens, tokenPos)
  const tok = tokens[tokenPos]
  const range = {
    startColumn: tok.offset + 1,
    endColumn: tok.offset + hoverValue.length + 1,
  }

  // check if there is a symbol behind to determine direction to move.
  const pkgNamePos = checkPackageNameToken(tokens, tokenPos - 1)
  if (pkgNamePos === -1) {
    return { value: hoverValue, range }
  }

  if (!isExported(hoverValue)) {
    return null
  }

  const pkgName = tokenToString(line, tokens, pkgNamePos)
  range.startColumn = tokens[pkgNamePos].offset + 1
  return {
    packageName: pkgName,
    value: hoverValue,
    range,
  }
}

const keywordHoverValue = (line: string, tokens: monaco.Token[], tokenPos: number): HoverValue => {
  const value = tokenToString(line, tokens, tokenPos)
  const { offset } = tokens[tokenPos]
  return {
    value,
    range: {
      startColumn: offset + 1,
      endColumn: offset + value.length + 1,
    },
  }
}

export const queryFromPosition = (
  model: monaco.editor.ITextModel,
  { lineNumber, column }: monaco.IPosition,
): HoverValue | null => {
  const line = model.getLineContent(lineNumber)
  const tokens = getLineTokens(line, model.getLanguageId())
  if (!tokens) {
    return null
  }

  const offset = column - 1
  const r = tokenByOffset(tokens, offset, line.length)
  if (!r) {
    return null
  }

  const { tok, index } = r
  if (tok.type === GoToken.Ident) {
    return resolveHoverValue(line, tokens, index)
  }

  if (isKeywordValueToken(tok.type)) {
    return keywordHoverValue(line, tokens, index)
  }

  if (tok.type !== GoToken.Ident) {
    return null
  }

  return resolveHoverValue(line, tokens, index)
}
