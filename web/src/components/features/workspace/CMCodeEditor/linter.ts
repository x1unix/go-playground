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

const markersToDiagnostics = (doc: Text, markers: monaco.editor.IMarkerData[]): Diagnostic[] => {
  return markers.map((m): Diagnostic => {
    const line = doc.line(m.startLineNumber)
    let { from, to } = line

    // TODO: respect end range
    if (m.startColumn > 0) {
      from += m.startColumn - 1
      to = from + 1
    }

    return {
      from,
      to,
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
