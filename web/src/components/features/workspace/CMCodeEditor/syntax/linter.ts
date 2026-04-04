import type { Diagnostic as CMDiagnostic } from '@codemirror/lint'
import type { Dispatch } from 'redux'
import type { Text } from '@codemirror/state'
import { DiagnosticSeverity, type Diagnostic as LSPDiagnostic } from 'vscode-languageserver-protocol'
import { Syntax, type DocumentState } from '~/lib/cm-react'
import type { Disposable } from '~/workers/types'
import { type AnalyzerWorkerRef, spawnAnalyzerWorker } from '~/workers/analyzer'
import { newMarkerAction } from '~/store'
import { stripSlash } from './utils'
import { getTimeNowUsageMarkers } from './time'

export interface SyntaxCheckOptions {
  warnAboutFakeDateTime?: boolean
}

type Severity = CMDiagnostic['severity']
const mapSeverity: Record<DiagnosticSeverity, Severity> = {
  [DiagnosticSeverity.Hint]: 'hint',
  [DiagnosticSeverity.Information]: 'info',
  [DiagnosticSeverity.Warning]: 'warning',
  [DiagnosticSeverity.Error]: 'error',
}

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n))

const lineCharacterToOffset = (doc: Text, line: number, character: number): number => {
  const safeLineNumber = clamp(line + 1, 1, doc.lines)
  const safeLine = doc.line(safeLineNumber)
  const safeCharacter = clamp(character, 0, safeLine.length)
  return safeLine.from + safeCharacter
}

const markersToDiagnostics = (doc: Text, markers: LSPDiagnostic[]): CMDiagnostic[] => {
  return markers.map((marker): CMDiagnostic => {
    const from = lineCharacterToOffset(doc, marker.range.start.line, marker.range.start.character)
    const to = lineCharacterToOffset(doc, marker.range.end.line, marker.range.end.character)

    const sortedFrom = Math.min(from, to)
    const sortedTo = Math.max(from, to)

    return {
      from: sortedFrom,
      to: sortedTo,
      severity: marker.severity ? (mapSeverity[marker.severity] ?? 'error') : 'error',
      message: marker.message,
    }
  })
}

export class GoSyntaxLinter implements Disposable {
  private readonly workerRef: AnalyzerWorkerRef

  constructor(private readonly dispatcher: Dispatch) {
    this.workerRef = spawnAnalyzerWorker()
  }

  dispose() {
    this.workerRef.dispose()
  }

  async check(doc: DocumentState, opts?: SyntaxCheckOptions): Promise<CMDiagnostic[]> {
    if (doc.language !== Syntax.Go) {
      return []
    }

    const markers: LSPDiagnostic[] = opts?.warnAboutFakeDateTime ? getTimeNowUsageMarkers(doc) : []

    try {
      const response = await this.workerRef.acquire(async (worker) => {
        return await worker.checkSyntaxErrors({
          fileName: doc.path,
          modelVersionId: 1,
          contents: doc.text.toString(),
        })
      })

      if (response.fileName === doc.path && response.markers) {
        markers.push(...response.markers)
      }
    } catch (err) {
      console.error('failed to perform syntax check', err)
    }

    this.dispatcher(newMarkerAction(stripSlash(doc.path), markers))
    return markersToDiagnostics(doc.text, markers)
  }
}
