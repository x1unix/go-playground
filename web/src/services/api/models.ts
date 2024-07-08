/**
 * Backend is Go version type
 */
export enum Backend {
  /**
   * Current Go version
   */
  Default = '',

  /**
   * Development branch (tip)
   */
  GoTip = 'gotip',

  /**
   * Previous Go version
   */
  GoPrev = 'goprev',
}

export enum EvalEventKind {
  Stdout = 'stdout',
  Stderr = 'stderr',
}

export interface ShareResponse {
  snippetID: string
}

export interface EvalEvent {
  Message: string
  Kind: EvalEventKind
  Delay: number
}

export interface RunResponse {
  events: EvalEvent[]
}

export interface FilesPayload {
  files: Record<string, string>
}

export interface BuildResponse {
  fileName: string
  isTest: boolean
}

export interface VersionResponse {
  version: string
}

export interface VersionsInfo {
  playground: {
    current: string
    goprev: string
    gotip: string
  }

  wasm: string
}
