import type * as monaco from 'monaco-editor'

export interface AnalyzeRequest {
  fileName: string
  contents: string
}

export interface AnalyzeResponse {
  fileName: string
  markers: monaco.editor.IMarkerData[] | null
}
