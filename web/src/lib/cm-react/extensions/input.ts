import { Compartment, type Extension } from '@codemirror/state'
import { keymap } from '@codemirror/view'
import { emacs } from '@replit/codemirror-emacs'
import { vim } from '@replit/codemirror-vim'
import { vscodeKeymap } from '@replit/codemirror-vscode-keymap'

import type { InputMode } from '../types'

const vscode = () => keymap.of(vscodeKeymap)

/**
 * Loads and returns an extension by input mode.
 *
 * Extensions are loaded on demand.
 */
const extensionByMode = (mode?: InputMode): Extension => {
  // TODO: lazy-load modules
  switch (mode) {
    case 'emacs': {
      return emacs()
    }
    case 'vim': {
      return vim()
    }
    default:
      return vscode()
  }
}

export const inputModeCompartment = new Compartment()

/**
 * Returns a new compartment for input mode extension with initial extension based on input mode.
 */
export const newInputModeCompartment = (mode?: InputMode) => inputModeCompartment.of(extensionByMode(mode))

/**
 * Returns a new state effect to reconfigure input mode.
 */
export const updateInputModeEffect = (mode?: InputMode) => inputModeCompartment.reconfigure(extensionByMode(mode))

/**
 * Returns a state effect that resets input mode back to regular.
 */
export const resetInputModeEffect = () => inputModeCompartment.reconfigure(vscode())
