import { StateEffect, StateField } from '@codemirror/state'

import { defaultBufferState, type BufferState } from './types'

/**
 * Effect to update BufferState for a given EditorState.
 */
export const updateBufferStateEffect = StateEffect.define<Partial<BufferState>>()

/**
 * Field to store and update BufferState in EditorState.
 */
export const bufferStateField = StateField.define<BufferState>({
  create() {
    return defaultBufferState
  },
  update(currentValue, transaction) {
    for (const effect of transaction.effects) {
      if (effect.is(updateBufferStateEffect)) {
        return { ...currentValue, initialized: true, ...effect.value }
      }
    }

    return currentValue
  },
})
