import { parser } from '@lezer/go'
import type * as monaco from 'monaco-editor'
import type { Text } from '@codemirror/state'
import type { DocumentState } from '~/lib/cm-react'

const warningSeverity = 4 as monaco.MarkerSeverity
const timeNowUsageWarning =
  'Warning: `time.Now()` will always return fake time. ' +
  'Change current environment to WebAssembly to use real date and time.'
const timeImportPathLiteral = '"time"'

interface OffsetRange {
  from: number
  to: number
}

type GoTree = ReturnType<typeof parser.parse>

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n))

const offsetToPosition = (doc: Text, offset: number) => {
  const safeOffset = clamp(offset, 0, doc.length)
  const line = doc.lineAt(safeOffset)
  return {
    lineNumber: line.number,
    column: safeOffset - line.from + 1,
  }
}

const hasTimeImport = (tree: GoTree, code: string): boolean => {
  let found = false

  tree.iterate({
    enter(node) {
      if (node.name !== 'ImportSpec') {
        return
      }

      const pathNode = node.node.getChild('String')
      if (pathNode && code.slice(pathNode.from, pathNode.to) === timeImportPathLiteral) {
        found = true
      }
    },
  })

  return found
}

const findTimeNowCallRanges = (tree: GoTree, code: string): OffsetRange[] => {
  const ranges: OffsetRange[] = []

  tree.iterate({
    enter(node) {
      if (node.name !== 'CallExpr') {
        return
      }

      const selector = node.node.getChild('SelectorExpr')
      if (!selector) {
        return
      }

      const packageName = selector.getChild('VariableName')
      const memberName = selector.getChild('FieldName')
      if (!packageName || !memberName) {
        return
      }

      if (
        code.slice(packageName.from, packageName.to) === 'time' &&
        code.slice(memberName.from, memberName.to) === 'Now'
      ) {
        ranges.push({ from: node.from, to: node.to })
      }
    },
  })

  return ranges
}

export const getTimeNowUsageMarkers = (doc: DocumentState): monaco.editor.IMarkerData[] => {
  const code = doc.text.toString()
  const tree = parser.parse(code)

  if (!hasTimeImport(tree, code)) {
    return []
  }

  const ranges = findTimeNowCallRanges(tree, code)
  if (ranges.length === 0) {
    return []
  }

  return ranges.map(({ from, to }) => {
    const start = offsetToPosition(doc.text, from)
    const end = offsetToPosition(doc.text, to)

    return {
      severity: warningSeverity,
      message: timeNowUsageWarning,
      startLineNumber: start.lineNumber,
      endLineNumber: end.lineNumber,
      startColumn: start.column,
      endColumn: end.column,
    }
  })
}
