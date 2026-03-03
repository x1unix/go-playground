import { Text, type ChangeSpec, type EditorState } from '@codemirror/state'
import { getBufferState } from './buffers/state'
import type { DocumentState } from './types'

// import type { Marker } from './types'

/**
 * Splits string into lines and returns Text instance for CM.
 */
export const docFromString = (str: string) => Text.of(str.split('\n'))

/**
 * Returns text replace change for effect to replace editor contents.
 *
 * @param state Current state to obtain content length.
 * @param contents New text content.
 */
export const newDocReplaceChange = (state: EditorState, contents: string): ChangeSpec => ({
  from: 0,
  to: state.doc.length,
  insert: docFromString(contents),
})

export const docStateFromEditor = (state: EditorState): DocumentState | undefined => {
  const buff = getBufferState(state)
  if (buff.isInitialised && buff.fileName) {
    // Skip uninitialized buffers
    return {
      path: buff.fileName,
      language: buff.syntax,
      text: state.doc,
    }
  }

  return undefined
}

/**
 * Converts list of markers from formatter to diagnostics format for '@codemirror/lint'.
 */
// export const mapMarkersToDiagnostics = (doc: Text, markers: Marker[]): Diagnostic[] =>
//   markers.map((marker) => {
//     const line = doc.line(marker.line)
//     let { from, to } = line
//
//     if (marker.column > 0) {
//       from += marker.column - 1
//       to = from + 1
//     }
//
//     return {
//       from,
//       to,
//       severity: marker.severity ?? 'error',
//       message: marker.message,
//     }
//   })
