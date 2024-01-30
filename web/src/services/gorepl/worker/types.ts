/**
 * Package manager event type
 */
export enum PMEventType {
  Empty = 0,
  DependencyCheckFinish = 1,
  DependencyResolveStart = 2,
  PackageSearchStart = 3,
  PackageDownload = 4,
  PackageExtract = 5,
}

/**
 * Program evaluation state
 */
export enum EvalState {
  Zero = 0,
  Begin = 1,
  Finish = 2,
  Error = 3,
  Panic = 4,
}

/**
 * Package manager event
 *
 * @see internal/gorepl/uihost/downloads.go
 */
export interface PackageManagerEvent {
  eventType: PMEventType
  success: boolean
  processedItems: number
  totalItems: number
  context: string
}

/**
 * Go program execution event
 */
export interface ProgramStateChangeEvent {
  state: EvalState
  message?: string
}

/**
 * EvalEventHandler handles Go program compilation and package manager events.
 */
export interface EvalEventHandler {
  onPackageManagerEvent: (e: PackageManagerEvent) => any
  onProgramEvalStateChange: (e: ProgramStateChangeEvent) => any
}
