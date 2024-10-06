import type * as monaco from 'monaco-editor'

export interface AnalyzeRequest {
  fileName: string
  contents: string
  modelVersionId: number
}

export interface AnalyzeResponse {
  fileName: string
  modelVersionId: number
  markers: monaco.editor.IMarkerData[] | null
}
