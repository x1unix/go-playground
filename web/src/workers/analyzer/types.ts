import type { Diagnostic } from 'vscode-languageserver-protocol'

export interface AnalyzeRequest {
  fileName: string
  contents: string
  modelVersionId: number
}

export interface AnalyzeResponse {
  fileName: string
  modelVersionId: number
  markers: Diagnostic[] | null
}
