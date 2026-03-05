import { parser } from '@lezer/go'
import type { SyntaxNode, Tree } from '@lezer/common'

import { ImportClauseType, type ImportsContext } from '~/workers/language/types'
import type { DocumentState } from '../types/common'

interface ImportBlock {
  range: NonNullable<ImportsContext['range']>
  imports: string[]
  isMultiline: boolean
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

const offsetToPosition = (doc: DocumentState['text'], offset: number) => {
  const safeOffset = Math.max(0, Math.min(offset, doc.length))
  const line = doc.lineAt(safeOffset)
  return {
    lineNumber: line.number,
    column: safeOffset - line.from + 1,
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

  const imports: string[] = []
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
        imports.push(importPath)
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
    const line = doc.line(start.lineNumber)
    return {
      isMultiline,
      imports,
      range: {
        startLineNumber: start.lineNumber,
        endLineNumber: start.lineNumber,
        startColumn: 1,
        endColumn: line.length + 1,
      },
    }
  }

  const end = offsetToPosition(doc, node.to)
  return {
    isMultiline,
    imports,
    range: {
      startLineNumber: start.lineNumber,
      endLineNumber: end.lineNumber,
      startColumn: 1,
      endColumn: end.column,
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

export const buildImportContext = (document: DocumentState): ImportsContext => {
  const source = document.text.toString()
  const tree = parser.parse(source)
  const topNodes: SyntaxNode[] = []
  for (let node = tree.topNode.firstChild; node; node = node.nextSibling) {
    topNodes.push(node)
  }

  const pkgIndex = packageNodeIndex(topNodes)
  if (pkgIndex === -1) {
    return {
      blockType: ImportClauseType.None,
    }
  }

  const packageLine = document.text.lineAt(topNodes[pkgIndex].from).number
  const packageEndCol = document.text.line(packageLine).length + 1
  const fallbackRange = {
    startLineNumber: packageLine,
    endLineNumber: packageLine,
    startColumn: packageEndCol,
    endColumn: packageEndCol,
  }

  const allImports: string[] = []
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
    allImports.push(...importBlock.imports)
  }

  if (lastImportBlock) {
    return {
      hasError,
      allPaths: new Set(allImports),
      blockPaths: lastImportBlock.imports,
      blockType: lastImportBlock.isMultiline ? ImportClauseType.Block : ImportClauseType.Single,
      range: lastImportBlock.range,
      totalRange: {
        startLineNumber: packageLine,
        endLineNumber: lastImportBlock.range.endLineNumber,
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
      startLineNumber: packageLine,
      endLineNumber: packageLine + 1,
    },
  }

  if (packageLine < document.text.lines) {
    const nextLine = document.text.line(packageLine + 1).text
    if (isBlankLine(nextLine)) {
      const next = document.text.line(packageLine + 1)
      importCtx.prependNewLine = false
      importCtx.range = {
        startLineNumber: next.number,
        endLineNumber: next.number,
        startColumn: next.length + 1,
        endColumn: next.length + 1,
      }
    }
  }

  return importCtx
}
