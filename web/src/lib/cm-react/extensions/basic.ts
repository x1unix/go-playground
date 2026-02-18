import { autocompletion, closeBrackets, closeBracketsKeymap, completionKeymap } from '@codemirror/autocomplete'
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import {
  bracketMatching,
  defaultHighlightStyle,
  foldGutter,
  foldKeymap,
  indentOnInput,
  syntaxHighlighting,
} from '@codemirror/language'
import { lintKeymap } from '@codemirror/lint'
import { highlightSelectionMatches, searchKeymap } from '@codemirror/search'
import { EditorState } from '@codemirror/state'
import {
  crosshairCursor,
  drawSelection,
  dropCursor,
  highlightActiveLine,
  highlightActiveLineGutter,
  highlightSpecialChars,
  keymap,
  lineNumbers,
  rectangularSelection,
} from '@codemirror/view'

export interface SetupOpts {
  lineNumbers?: Parameters<typeof lineNumbers>[0]
  foldGutter?: Parameters<typeof foldGutter>[0]
}

export const basicSetup = (opts?: SetupOpts) => {
  const keymaps = [
    closeBracketsKeymap,
    defaultKeymap,
    searchKeymap,
    historyKeymap,
    foldKeymap,
    completionKeymap,
    lintKeymap,
  ].flat()

  return [
    lineNumbers(opts?.lineNumbers),
    highlightActiveLineGutter(),
    highlightSpecialChars(),
    history(),
    foldGutter(opts?.foldGutter),
    drawSelection(),
    dropCursor(),
    EditorState.allowMultipleSelections.of(true),
    indentOnInput(),
    syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
    bracketMatching(),
    closeBrackets(),
    autocompletion(),
    rectangularSelection(),
    crosshairCursor(),
    highlightActiveLine(),
    highlightSelectionMatches(),
    // indentUnit.of(' '.repeat(options.tabSize)),
    keymap.of(keymaps),
  ]
}
