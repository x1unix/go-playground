import { SliceOf, Struct, Uint32, UintPtr } from '../../../types'

export interface Value {
  ref: number
  gcPtr: number
}

export interface Func {
  value: Value
  id: number
}

/**
 * `syscall/js.Value` type.
 */
export const ValueType = Struct('syscall/js.Value', [
  { key: 'ref', type: UintPtr },
  { key: 'gcPtr', type: UintPtr },
])

/**
 * `syscall/js.Func` type.
 */
export const FuncType = Struct('syscall/js.Func', [
  { key: 'value', type: ValueType },
  { key: 'id', type: Uint32 },
])

export const ValueSlice = SliceOf<Value>(ValueType)
