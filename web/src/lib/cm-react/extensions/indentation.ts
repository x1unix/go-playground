import { Compartment, EditorState, type Extension } from '@codemirror/state'
import { indentUnit } from '@codemirror/language'

const defaultTabSize = 4

export const indentationCompartment = new Compartment()

const makeIndentationExtension = (tabSize = defaultTabSize): Extension => [
  EditorState.tabSize.of(tabSize),
  indentUnit.of('\t'),
]

/**
 * Returns a new compartment for indentation options.
 */
export const newIndentationCompartment = (tabSize?: number) =>
  indentationCompartment.of(makeIndentationExtension(tabSize))

/**
 * Returns a state effect to update indentation options.
 */
export const updateIndentationEffect = (tabSize?: number) =>
  indentationCompartment.reconfigure(makeIndentationExtension(tabSize))
