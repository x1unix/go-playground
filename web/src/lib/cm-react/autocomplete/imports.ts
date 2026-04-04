import { parser } from '@lezer/go'
import type { SyntaxNode, Tree } from '@lezer/common'
import type { Position, Range } from 'vscode-languageserver-protocol'

import { ImportClauseType, type ImportsContext } from '~/workers/language/types'
import type { DocumentState } from '../types/common'

interface ImportBlock {
  range: NonNullable<ImportsContext['range']>
  imports: ImportSpec[]
  isMultiline: boolean
}

interface ImportSpec {
  path: string
  alias?: string
}

const commentNodes = new Set(['LineComment', 'BlockComment'])

const unquote = (str: string) => {
  if (str.startsWith('"')) {
    str = str.slice(1)
  }

  if (str.endsWith('"')) {
    str = str.slice(0, -1)
  }

  return str
}

const isBlankLine = (line: string) => line.trim().length === 0

const offsetToPosition = (doc: DocumentState['text'], offset: number): Position => {
  const safeOffset = Math.max(0, Math.min(offset, doc.length))
  const line = doc.lineAt(safeOffset)
  return {
    // CodeMirror uses 1-based line numbers; LSP Position uses 0-based lines.
    line: line.number - 1,
    // CodeMirror offsets are 0-based inside a line, which matches LSP character indexing.
    character: safeOffset - line.from,
  }
}

const hasErrorInRange = (tree: Tree, from: number, to: number) => {
  let hasError = false
  tree.iterate({
    from,
    to,
    enter: (node) => {
      if (node.type.isError) {
        hasError = true
      }

      return !hasError
    },
  })

  return hasError
}

const parseImportDecl = (
  node: SyntaxNode,
  tree: Tree,
  source: string,
  doc: DocumentState['text'],
): ImportBlock | null => {
  if (hasErrorInRange(tree, node.from, node.to)) {
    return null
  }

  const imports: ImportSpec[] = []
  let invalidSpec = false
  tree.iterate({
    from: node.from,
    to: node.to,
    enter: (cursor) => {
      if (cursor.name !== 'ImportSpec') {
        return
      }

      const pathNode = cursor.node.getChild('String')
      if (!pathNode) {
        invalidSpec = true
        return false
      }

      const importPath = unquote(source.slice(pathNode.from, pathNode.to).trim())
      if (importPath.length > 0) {
        const aliasNode = cursor.node.getChild('DefName')
        const alias = aliasNode ? source.slice(aliasNode.from, aliasNode.to).trim() : undefined
        imports.push({
          path: importPath,
          alias,
        })
      }

      return false
    },
  })

  if (invalidSpec) {
    return null
  }

  const isMultiline = !!node.getChild('SpecList')
  const start = offsetToPosition(doc, node.from)
  if (!isMultiline) {
    const line = doc.line(start.line + 1)
    return {
      isMultiline,
      imports,
      range: {
        start: {
          line: start.line,
          character: 0,
        },
        end: {
          line: start.line,
          character: line.length,
        },
      },
    }
  }

  const end = offsetToPosition(doc, node.to)
  return {
    isMultiline,
    imports,
    range: {
      start: {
        line: start.line,
        character: 0,
      },
      end,
    },
  }
}

const packageNodeIndex = (nodes: SyntaxNode[]) => {
  for (let i = 0; i < nodes.length; i++) {
    const nodeName = nodes[i].type.name
    if (commentNodes.has(nodeName)) {
      continue
    }

    if (nodeName === 'PackageClause') {
      return i
    }

    return -1
  }

  return -1
}

const topLevelNodes = (source: string) => {
  const tree = parser.parse(source)
  const nodes: SyntaxNode[] = []
  for (let node = tree.topNode.firstChild; node; node = node.nextSibling) {
    nodes.push(node)
  }

  return {
    tree,
    nodes,
  }
}

export const isWithinImportClause = (document: DocumentState, lineNumber: number) => {
  const source = document.text.toString()
  const { nodes } = topLevelNodes(source)
  const pkgIndex = packageNodeIndex(nodes)
  if (pkgIndex === -1) {
    return false
  }

  for (let i = pkgIndex + 1; i < nodes.length; i++) {
    const node = nodes[i]
    if (commentNodes.has(node.type.name)) {
      continue
    }

    if (node.type.name !== 'ImportDecl') {
      break
    }

    const startLine = document.text.lineAt(node.from).number
    const endLine = document.text.lineAt(node.to).number
    if (lineNumber >= startLine && lineNumber <= endLine) {
      return true
    }
  }

  return false
}

export const buildImportContext = (document: DocumentState): ImportsContext => {
  const source = document.text.toString()
  const { tree, nodes: topNodes } = topLevelNodes(source)

  const pkgIndex = packageNodeIndex(topNodes)
  if (pkgIndex === -1) {
    return {
      blockType: ImportClauseType.None,
    }
  }

  const packageLine = document.text.lineAt(topNodes[pkgIndex].from).number
  // Convert package line from CodeMirror's 1-based numbering to LSP's 0-based numbering.
  const packageLineIndex = packageLine - 1
  const packageEndChar = document.text.line(packageLine).length
  const fallbackRange: Range = {
    start: {
      line: packageLineIndex,
      character: packageEndChar,
    },
    end: {
      line: packageLineIndex,
      character: packageEndChar,
    },
  }

  const allImports: string[] = []
  const importAliases = new Map<string, string>()
  let hasError = false
  let lastImportBlock: ImportBlock | null = null

  for (let i = pkgIndex + 1; i < topNodes.length; i++) {
    const node = topNodes[i]
    if (commentNodes.has(node.type.name)) {
      continue
    }

    if (node.type.name !== 'ImportDecl') {
      break
    }

    const importBlock = parseImportDecl(node, tree, source, document.text)
    if (!importBlock) {
      hasError = true
      break
    }

    lastImportBlock = importBlock
    allImports.push(...importBlock.imports.map(({ path }) => path))

    for (const { alias, path } of importBlock.imports) {
      if (!alias || alias === '_') {
        continue
      }

      importAliases.set(alias, path)
    }
  }

  if (lastImportBlock) {
    return {
      hasError,
      allPaths: new Set(allImports),
      ...(importAliases.size ? { importAliases } : {}),
      blockPaths: lastImportBlock.imports.map(({ path }) => path),
      blockType: lastImportBlock.isMultiline ? ImportClauseType.Block : ImportClauseType.Single,
      range: lastImportBlock.range,
      totalRange: {
        start: {
          line: packageLineIndex,
          character: 0,
        },
        end: {
          line: lastImportBlock.range.end.line,
          character: 0,
        },
      },
    }
  }

  if (hasError) {
    return {
      hasError: true,
      blockType: ImportClauseType.None,
    }
  }

  const importCtx: ImportsContext = {
    blockType: ImportClauseType.None,
    range: fallbackRange,
    prependNewLine: true,
    totalRange: {
      start: {
        line: packageLineIndex,
        character: 0,
      },
      end: {
        line: packageLine,
        character: 0,
      },
    },
  }

  if (packageLine < document.text.lines) {
    const nextLine = document.text.line(packageLine + 1).text
    if (isBlankLine(nextLine)) {
      const next = document.text.line(packageLine + 1)
      importCtx.prependNewLine = false
      importCtx.range = {
        start: {
          // Convert CodeMirror's 1-based line to LSP's 0-based line.
          line: next.number - 1,
          character: next.length,
        },
        end: {
          // Convert CodeMirror's 1-based line to LSP's 0-based line.
          line: next.number - 1,
          character: next.length,
        },
      }
    }
  }

  return importCtx
}
