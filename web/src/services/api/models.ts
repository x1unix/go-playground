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

export interface Snippet {
  fileName: string
  code: string
}

export interface EvalEvent {
  Message: string
  Kind: EvalEventKind
  Delay: number
}

export interface RunResponse {
  formatted?: string | null
  events: EvalEvent[]
}

export interface BuildResponse {
  formatted?: string | null
  fileName: string
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
