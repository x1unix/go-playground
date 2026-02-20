import type { EditorState, StateEffect } from '@codemirror/state'

import { clearHighlightsEffect } from '../extensions/highlight'
import { updateInputModeEffect } from '../extensions/input'
import { readOnlyEffect } from '../extensions/readonly'
import { syntaxFromFileName, updateSyntaxEffect } from '../extensions/syntax'
import { updateThemeEffect } from '../extensions/themes'
import { defaultEditorPreferences, EditorPreferences, type EditorProps } from '../props'
import { bufferStateField, updateBufferStateEffect } from './field'
import { defaultBufferState, type BufferState } from './types'

/**
 * Creates new uninitialized StateData from React component props.
 */
export const bufferStateFromProps = (
  seq: number,
  { preferences, readonly: readOnly = false, value }: EditorProps,
  defaults = defaultBufferState,
): BufferState => ({
  seq: seq,
  isInitialised: false,
  preferences: preferences ?? defaults.preferences,
  fileName: value?.path,
  syntax: syntaxFromFileName(value?.path),
  readOnly,
})

/**
 * Creates a new extension instance to use BufferState in editor with defaults from React props.
 * Any custom state field is essentially an extension.
 *
 * Props function invoked any time when trying to get BufferState on an empty EditorState.
 * Check the `isInitialized` field to check if `BufferState` is not defaults.
 */
export const newBufferStateFieldExtension = (propsFn: () => { seq: number; props: EditorProps }) => {
  // return bufferStateField.init(() => bufferStateFromProps(propsFn()))
  return bufferStateField.init(() => {
    // TODO: use uninitialized confseq instead?
    const { seq, props } = propsFn()
    return bufferStateFromProps(seq, props)
  })
}

/**
 * Returns effect that sets BufferState field in EditorState.
 *
 * Used to write field at a new, fresh empty EditorState.
 * Necessary as if BufferState field is undefined, `state.field()` will return
 * every time a new copy of defaults based on current React props.
 *
 * This behavior breaks change detection and can be fixed by writing
 * BufferState field manually to each new state.
 */
export const setBufferStateEffect = (seq: number, props: EditorProps) => {
  const stateData = bufferStateFromProps(seq, props)
  stateData.isInitialised = true
  return updateBufferStateEffect.of(stateData)
}

/**
 * Retrieves BufferState from a given editor state.
 *
 * Returns default value if a given EditorState doesn't have an assigned BufferState.
 * Check `isInitialized` field to check if `StateData` is not defaults.
 */
export const getBufferState = (state: EditorState) => {
  // Returned value is always defined as the fallback value is defined in bufferStateField.
  return state.field(bufferStateField, false)!
}

/**
 * Checks whether a given EditorState contains an initialized BufferState.
 */
export const hasBufferState = (state: EditorState) => !!getBufferState(state).isInitialised

type StateEffects = Array<StateEffect<any>>

interface ChangeSet {
  effects: StateEffects
  isChanged: boolean
  changes: Partial<BufferState>
}

/**
 * Data necessary to operate with state extensions.
 */
interface ExtensionContext {
  // Not used at the moment, reserved for future use.
}

interface CheckBufferStateChangesArgs {
  /**
   * Current editor configuration sequence number.
   */
  seq: number

  /**
   * Current editor props.
   */
  props: EditorProps

  /**
   * Target buffer state.
   */
  buffState: BufferState

  /**
   * Extension-specific data.
   *
   * Unused, reserved for future needs.
   */
  extensions?: ExtensionContext
}

/**
 * Compares a BufferState object obtained from EditorState with component props.
 *
 * Returns a list of effects to be applied on editor based updated component props.
 * Used to update editor state according to values in props.
 *
 * Does most of heavy lifting job on change detection instead of `React.componentDidUpdate`.
 */
export const checkBufferStateChanges = ({ seq, props, buffState }: CheckBufferStateChangesArgs): ChangeSet => {
  const { value, preferences, readonly = false } = props
  const effects: StateEffects = []
  const changes: Partial<BufferState> = {
    seq,
    isInitialised: true,
  }

  // This flag is false if state was just created and doesn't have buffState assigned yet.
  // This happens when EditorState was just created for a new file or `getStateData` called on empty state.
  //
  // Just initialise the BufferState by setting it to EditorState and initialize all compartments.
  // This is necessary because some compartments like themes needs to be initialized for every state.
  const { isInitialised } = buffState

  const fileSyntax = syntaxFromFileName(value?.path)

  if (!isInitialised || buffState.fileName !== value?.path) {
    // Clear highlights on tab switch
    effects.push(clearHighlightsEffect())
    changes.fileName = value?.path
  }

  if (!isInitialised || buffState.syntax !== fileSyntax) {
    effects.push(updateSyntaxEffect(fileSyntax))
    changes.syntax = fileSyntax
  }

  if (!isInitialised || buffState.readOnly !== readonly) {
    effects.push(readOnlyEffect(readonly))
    changes.readOnly = readonly
  }

  if (isInitialised && seq == buffState.seq) {
    // Early exit if only current buffer changed
    return newChangeSet(effects, changes)
  }

  const buffPrefs = buffState.preferences
  const currentPrefs = preferences ?? defaultEditorPreferences
  if (!isInitialised || buffPrefs.inputMode !== currentPrefs.inputMode) {
    effects.push(updateInputModeEffect(currentPrefs.inputMode))
    changes.preferences = currentPrefs
  }

  if (!isInitialised || isThemeChanged(buffPrefs, currentPrefs)) {
    effects.push(updateThemeEffect(currentPrefs))
    changes.preferences = currentPrefs
  }

  const isChanged = Object.keys(changes).length > 0
  if (isChanged) {
    effects.unshift(updateBufferStateEffect.of(changes))
  }

  return { isChanged, effects, changes }
}

const isThemeChanged = (prev: EditorPreferences, curr: EditorPreferences) =>
  prev.colorScheme != curr.colorScheme || prev.fontFamily != curr.fontFamily || prev.fontSize != curr.fontSize

const newChangeSet = (effects: StateEffects, changes: Partial<BufferState>): ChangeSet => {
  const isChanged = Object.keys(changes).length > 0
  if (isChanged) {
    effects.unshift(updateBufferStateEffect.of(changes))
  }

  return { isChanged, effects, changes }
}

/**
 * Returns a new BufferState based on a current one in EditorState but for a different document.
 */
export const newBufferStateFromSnapshot = (state?: EditorState, fileName?: string): BufferState => {
  const previous = state ? getBufferState(state) : defaultBufferState

  return {
    ...previous,
    isInitialised: false,
    fileName,
  }
}
