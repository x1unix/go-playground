import type { Diagnostic } from '@codemirror/lint'
import { Text, type ChangeSpec, type EditorState } from '@codemirror/state'

import type { Marker } from './types'

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

/**
 * Converts list of markers from formatter to diagnostics format for '@codemirror/lint'.
 */
export const mapMarkersToDiagnostics = (doc: Text, markers: Marker[]): Diagnostic[] =>
  markers.map((marker) => {
    const line = doc.line(marker.line)
    let { from, to } = line

    if (marker.column > 0) {
      from += marker.column - 1
      to = from + 1
    }

    return {
      from,
      to,
      severity: marker.severity ?? 'error',
      message: marker.message,
    }
  })
