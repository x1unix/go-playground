import { Compartment, EditorState } from '@codemirror/state'

/**
 * Compartment to manage read-only property.
 *
 * @see https://discuss.codemirror.net/t/codemirror-6-readonly-editor/3930
 */
export const readOnlyCompartment = new Compartment()

export const readOnlyEffect = (isReadOnly: boolean) =>
  readOnlyCompartment.reconfigure(EditorState.readOnly.of(isReadOnly))

export const newReadOnlyCompartment = (defaults = false) => readOnlyCompartment.of(EditorState.readOnly.of(defaults))
