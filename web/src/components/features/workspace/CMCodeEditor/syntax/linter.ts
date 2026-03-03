import type { Diagnostic } from '@codemirror/lint'
import type { Dispatch } from 'redux'
import type * as monaco from 'monaco-editor'
import type { Text } from '@codemirror/state'
import { Syntax, type DocumentState } from '~/lib/cm-react'
import { type Disposable, type AnalyzerWorker, spawnAnalyzerWorker } from '~/workers/analyzer'
import { newMarkerAction } from '~/store'
import { stripSlash } from './utils'

export interface SyntaxCheckOptions {
  warnAboutFakeDateTime?: boolean
}

type Severity = Diagnostic['severity']
const mapSeverity: Record<monaco.MarkerSeverity, Severity> = {
  1: 'hint',
  2: 'info',
  4: 'warning',
  8: 'error',
}

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n))

const lineColumnToOffset = (doc: Text, lineNumber: number, column: number): number => {
  const safeLineNumber = clamp(lineNumber, 1, doc.lines)
  const line = doc.line(safeLineNumber)
  const safeColumn = clamp(column, 1, line.length + 1)
  return line.from + safeColumn - 1
}

const markersToDiagnostics = (doc: Text, markers: monaco.editor.IMarkerData[]): Diagnostic[] => {
  return markers.map((m): Diagnostic => {
    const from = lineColumnToOffset(doc, m.startLineNumber, m.startColumn)
    const to = lineColumnToOffset(doc, m.endLineNumber, m.endColumn)

    const sortedFrom = Math.min(from, to)
    const sortedTo = Math.max(from, to)

    return {
      from: sortedFrom,
      to: sortedTo,
      severity: mapSeverity[m.severity] ?? 'error',
      message: m.message,
    }
  })
}

export class GoSyntaxLinter implements Disposable {
  private readonly disposer: Disposable
  private readonly worker: AnalyzerWorker

  constructor(private readonly dispatcher: Dispatch) {
    const [worker, disposer] = spawnAnalyzerWorker()
    this.worker = worker
    this.disposer = disposer
  }

  dispose() {
    this.disposer.dispose()
  }

  async check(doc: DocumentState, opts?: SyntaxCheckOptions): Promise<Diagnostic[]> {
    if (doc.language !== Syntax.Go) {
      return []
    }

    let markers: monaco.editor.IMarkerData[] = []

    try {
      const response = await this.worker.checkSyntaxErrors({
        fileName: doc.path,
        modelVersionId: 1,
        contents: doc.text.toString(),
      })

      if (response.fileName === doc.path && response.markers) {
        markers = response.markers
      }
    } catch (err) {
      console.error('failed to perform syntax check', err)
    }

    this.dispatcher(newMarkerAction(stripSlash(doc.path), markers))
    return markersToDiagnostics(doc.text, markers)
  }
}
