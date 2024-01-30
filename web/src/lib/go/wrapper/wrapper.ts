import { StackReader } from '../stack'
import { MemoryInspector } from '../debug'
import { Bool, GoStringType, Int32 } from '../types'
import { type GoInstance, type ImportObject, type PendingEvent } from './interface'
import { type Func, Ref, RefType } from '../pkg/syscall/js'
import { MemoryView } from '../memory/view'

import { type GoWebAssemblyInstance, wrapWebAssemblyInstance } from './instance'

/**
 * Returns object which contains WebAssembly imports.
 * @param go Go instance
 * @returns
 */
export const getImportNamespace = (go: GoInstance) =>
  // Since Go 1.21, exported functions are stored in 'gojs' object.
  go.importObject.gojs ?? go.importObject.go

/**
 * Wraps global namespace with specified overlay and replaces Go class instance
 * with a correct one.
 *
 * @param overlay Overlay object
 * @param globalValue global namespace
 */
export const wrapGlobal = (overlay: object = {}, globalValue: object = window || globalThis) => {
  const mockObject = {
    ...overlay,
    Go: GoWrapper,
  }

  for (const key in globalValue) {
    if (key === 'Go') {
      continue
    }

    if (key in overlay) {
      continue
    }

    const prop = globalValue[key]
    if (typeof prop !== 'function') {
      mockObject[key] = prop
      continue
    }

    mockObject[key] = (...args) => Reflect.apply(Reflect.get(globalValue, key), globalValue, args)
  }

  Object.setPrototypeOf(mockObject, globalValue)
  return mockObject
}

export type CallImportHandler = (sp: number, stack: StackReader, mem: MemoryView) => any

export interface Options {
  debug?: boolean
  debugCalls?: string[]
  globalValue?: any
}

export class GoWrapper {
  private _inspector: MemoryInspector | null = null
  private _memView: MemoryView | null = null
  private readonly _debug: boolean = false
  private readonly _debugCalls: Set<string>
  private _globalValue: object
  private readonly go: GoInstance

  /**
   * Go program exit listener
   */
  public onExit?: (code: number) => void

  /**
   * Returns WebAssembly memory inspector
   */
  get inspector() {
    return this._inspector
  }

  get _pendingEvent() {
    return this.go._pendingEvent
  }

  set _pendingEvent(value) {
    this.go._pendingEvent = value
  }

  get memory() {
    return this.go.mem
  }

  get importObject(): ImportObject {
    return this.go.importObject
  }

  private get exports() {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return this.go._inst!.exports
  }

  constructor(parent: GoInstance, { debug = false, debugCalls, globalValue }: Options = {}) {
    this.go = parent
    this._debug = debug
    this._debugCalls = new Set(debugCalls ?? [])
    this._globalValue = globalValue?.Go === GoWrapper ? globalValue : wrapGlobal()

    this.patchImportObject()
  }

  /**
   * Stores JS value in values table and returns value ref ID.
   * @param v
   * @private
   */
  private storeObject(v: any): number {
    if (!Ref.isReferenceableValue(v)) {
      return 0
    }

    let id = this.go._ids.get(v)
    if (id === undefined) {
      id = this.go._idPool.pop()
      if (id === undefined) {
        id = this.go._values.length
      }
      this.go._values[id] = v
      this.go._goRefCounts[id] = 0
      this.go._ids.set(v, id)
    }
    this.go._goRefCounts[id]++
    return id
  }

  private patchImportObject() {
    this.exportFunction('runtime.resetMemoryDataView', () => {
      this.go.mem = new DataView(this.exports.mem.buffer)
      this._memView?.reset(this.exports.mem)
      this._inspector = new MemoryInspector(this.exports.mem)
    })

    this.exportFunction('syscall/js.valueCall', (sp, reader) => {
      this.valueCall(sp, reader)
    })

    const wasmExitFunc = getImportNamespace(this.go)['runtime.wasmExit']
    this.exportFunction('runtime.wasmExit', (sp, reader) => {
      reader.skipHeader()
      const code = reader.next<number>(Int32)
      wasmExitFunc.call(this.go, sp)
      this.onExit?.(code)
    })
  }

  private valueCall(sp: number, reader: StackReader) {
    reader.skipHeader()
    let result: any
    let success: boolean

    try {
      const obj = reader.nextRef()
      const methodName = reader.next<string>(GoStringType)
      const args = reader.nextRefSlice()

      if (this.isCallDebuggable('syscall/js.valueCall')) {
        const funcName = `${obj.constructor.name}.${methodName}`
        console.log(`js.ValueCall: ${funcName}`, {
          obj,
          methodName,
          args,
        })
      }

      const method = Reflect.get(obj, methodName)
      result = Reflect.apply(method, obj, args)
      success = true
    } catch (err) {
      result = err
      success = false
      if (this._debug) {
        console.error(`js.ValueCall: Error - ${err}`)
      }
    }

    const resultRef = Ref.fromValue(result, this.storeObject(result))
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    reader.updateStackPointer(this.go._inst!.exports.getsp() >>> 0)
    reader.writer().write(RefType, resultRef).write(Bool, success)
  }

  /**
   * Loads a JS value from memory
   * @param addr
   * @private
   */
  private loadValue(addr: number) {
    const f = this.go.mem.getFloat64(addr, true)
    if (f === 0) {
      return
    }

    if (!isNaN(f)) {
      return f
    }

    const id = this.go.mem.getUint32(addr, true)
    return this.go._values[id]
  }

  /**
   * Replaces 'globalThis' value with desired global object.
   * @param globalValue
   * @private
   */
  private initReferences(globalValue: object) {
    // Should be in sync with 'wasm_exec.js';
    this.go._values = [NaN, 0, null, true, false, globalValue, this]

    this.go._goRefCounts = new Array(this.go._values.length).fill(Infinity)
    const items: Array<[any, number]> = [
      [0, 1],
      [null, 2],
      [true, 3],
      [false, 4],
      [globalValue, 5],
      [this, 6],
    ]
    this.go._ids = new Map(items)
    this.go._idPool = []
    this.go.exited = false
  }

  setGlobalObject(newGlobalThis: object) {
    this._globalValue = newGlobalThis
    this.patchImportObject()
  }

  /**
   * Call exported Go function by event ID.
   *
   * See `syscall/js.funcs` map.
   *
   * @param id Event ID
   * @param args Arguments
   */
  callEventById(id, args: any[]) {
    const event: PendingEvent = {
      id,
      this: this,
      args,
    }

    this.go._pendingEvent = event
    this.go._resume()
    return event.result
  }

  /**
   * Call exported `js.Func` callback
   * @param fn
   * @param args
   */
  callFunc(fn: Func, args: any[]) {
    return this.callEventById(fn.id, args)
  }

  /**
   * Adds function to import object
   * @param name symbol name (package.functionName)
   * @param func handler
   */
  exportFunction(name: string, func: CallImportHandler) {
    const importObject = getImportNamespace(this.go)
    importObject[name] = this._wrapExportHandler(name, func)
  }

  /**
   * Register a CallImport handler
   * @param name method name
   * @param func
   * @returns {*}
   * @private
   */
  private _wrapExportHandler(name: string, func: CallImportHandler) {
    return (sp: number) => {
      sp >>>= 0
      const isDebug = this.isCallDebuggable(name)
      if (isDebug) {
        console.log(`CallImport: ${name} (SP: ${sp.toString(16)})`)
      }

      const reader = new StackReader(this.go.mem, this.go._values, sp, { debug: isDebug })

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return func(sp, reader, this._memView!)
    }
  }

  _makeFuncWrapper(id: number) {
    return (...args): any => {
      if (this._debug) {
        console.log('Go._makeFuncWrapper:', { id, args })
      }

      const event: any = { id, this: this.go, args }
      this.go._pendingEvent = event
      this.go._resume()
      return event.result
    }
  }

  /**
   * Set environment variable
   *
   * @param key
   * @param value
   */
  setEnv(key: string, value: string) {
    this.go.env[key] = value
  }

  /**
   * Start Go program
   */
  async run(instance: GoWebAssemblyInstance) {
    // Wrap wasm instance to re-initialise import object before run.
    const wrappedInstance = wrapWebAssemblyInstance(instance, {
      run: () => {
        this.initReferences(this._globalValue)
      },
    })

    // Pass raw memory reference to avoid race condition on mutation and update.
    this._inspector = MemoryInspector.fromInstance(wrappedInstance)
    this._memView = MemoryView.fromInstance(wrappedInstance, this.go._values, {
      debug: this._debug,
    })

    await this.go.run(wrappedInstance)
  }

  exit(code: number) {
    return this.go.exit(code)
  }

  _resume() {
    return this.go._resume()
  }

  private isCallDebuggable(name: string) {
    if (!this._debug) {
      return false
    }

    if (!this._debugCalls?.size) {
      return false
    }

    return this._debugCalls.has(name)
  }
}
