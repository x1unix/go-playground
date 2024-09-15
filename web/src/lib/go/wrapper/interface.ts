import { type GoWebAssemblyInstance } from './instance'

export type JSValuesTable = any[]

export interface PendingEvent {
  this: any
  id: number
  args?: any[]
  result?: any
}

type ImportFunction = (sp: number) => any
type FuncWrapper = () => PendingEvent['result']

export interface ImportObject {
  /**
   * Legacy Go import namespace. Used in Go 1.20.x and below.
   *
   * @deprecated
   * **WARNING:** Since Go 1.21.x this attribute was replaced by `gojs` namespace.
   */
  go: Record<string, ImportFunction>

  /**
   * Go import namespace since Go 1.21.x.
   */
  gojs: Record<string, ImportFunction>

  /**
   * The go.test namespace. Used by `testing` package.
   *
   * Introduced in Go 1.21.x.
   */
  _gotest: Record<string, ImportFunction>

  [k: string]: any
}

export interface GoInstance {
  mem: DataView
  argv: string[]
  env: Record<string, string>
  importObject: ImportObject

  /**
   * whether the Go program has exited
   */
  exited: boolean

  _pendingEvent?: PendingEvent
  _scheduledTimeouts: Map<number, any>
  _nextCallbackTimeoutID: number
  _inst?: GoWebAssemblyInstance

  /**
   * JS values that Go currently has references to, indexed by reference id
   * @protected
   */
  _values: JSValuesTable

  /**
   * Number of references that Go has to a JS value, indexed by reference id
   * @protected
   */
  _goRefCounts: any[]

  /**
   * Mapping from JS values to reference ids
   * @protected
   */
  _ids: Map<any, number>

  /**
   * Unused ids that have been garbage collected
   * @protected
   */
  _idPool: number[]

  _makeFuncWrapper: (id: number) => FuncWrapper
  run: (instance: GoWebAssemblyInstance) => Promise<void>
  exit: (code: number) => any
  _resume: () => any
}
