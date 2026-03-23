import { parser } from '@lezer/go'
import type { Text } from '@codemirror/state'
import { DiagnosticSeverity, type Diagnostic, type Position } from 'vscode-languageserver-protocol'
import type { DocumentState } from '~/lib/cm-react'

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

const offsetToPosition = (doc: Text, offset: number): Position => {
  const safeOffset = clamp(offset, 0, doc.length)
  const line = doc.lineAt(safeOffset)
  return {
    line: line.number - 1,
    character: safeOffset - line.from,
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

export const getTimeNowUsageMarkers = (doc: DocumentState): Diagnostic[] => {
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
      severity: DiagnosticSeverity.Warning,
      message: timeNowUsageWarning,
      range: {
        start,
        end,
      },
    }
  })
}
