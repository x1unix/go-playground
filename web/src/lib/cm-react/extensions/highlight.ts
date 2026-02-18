import { StateEffect, StateField, type EditorState } from '@codemirror/state'
import { Decoration, EditorView } from '@codemirror/view'

import { highlightClasses } from './themes'

// Define an effect to toggle a highlight decoration
export const addHighlight = StateEffect.define<number>({
  map: (value, mapping) => {
    mapping.mapPos(value)
    return value
  },
})

export const removeHighlight = StateEffect.define()

const clearAllHighlights = StateEffect.define({
  // Mapping remains the same as it does not depend on specific positions
  map: (value) => value,
})

/**
 * Returns EditorState effect that removes all highlights.
 */
export const clearHighlightsEffect = () => clearAllHighlights.of(null)

// State field to manage highlights.
export const highlightField = StateField.define({
  create() {
    return Decoration.none
  },
  update(decorations, tr) {
    decorations = decorations.map(tr.changes)
    for (const effect of tr.effects) {
      if (effect.is(addHighlight)) {
        const deco = Decoration.line({
          attributes: { class: highlightClasses.line },
        })
        decorations = decorations.update({ add: [deco.range(effect.value)] })
      } else if (effect.is(removeHighlight)) {
        decorations = decorations.update({ filter: (from) => from !== effect.value })
      } else if (effect.is(clearAllHighlights)) {
        return Decoration.none // Clear all highlights
      }
    }
    return decorations
  },
  provide: (f) => EditorView.decorations.from(f),
})

export const isHighlighted = (state: EditorState, lineNumber: number) => {
  const linePos = state.doc.line(lineNumber).from

  let found = false
  state.field(highlightField, false)?.between(linePos, linePos + 1, (_from, _to, decoration) => {
    if (decoration.spec.attributes.class === highlightClasses.line) {
      found = true
      return false
    }
  })

  return found
}
