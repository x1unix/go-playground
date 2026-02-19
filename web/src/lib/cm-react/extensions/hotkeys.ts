import { Prec } from '@codemirror/state'
import { type Command, keymap } from '@codemirror/view'

import { newDocReplaceChange } from '../utils'
import type { DocumentState } from '../types'
import { readOnlyEffect } from './readonly'

type DocumentUpdateHandler = (e: DocumentState) => Promise<string> | undefined

export interface HotkeyHandler {
  onShare?: DocumentUpdateHandler
  onFormat?: DocumentUpdateHandler
  onRun?: DocumentUpdateHandler
}

const newUpdaterCmd = (fn?: DocumentUpdateHandler): Command | undefined => {
  if (!fn) return

  return (view) => {
    const p = fn({
      path: '', // TODO: fill path from state
      text: view.state.doc,
    })

    if (!p) {
      return true
    }

    // Make buffer readonly during document update transaction.
    view.dispatch({
      effects: readOnlyEffect(true),
    })

    p.then((changes) => {
      view.dispatch({
        changes: newDocReplaceChange(view.state, changes),
      })
    }).finally(() => {
      view.dispatch({
        effects: readOnlyEffect(false),
      })
    })

    return true
  }
}

/**
 * Returns a new hotkey plugin that handles editor settings.
 */
export const newHotkeyHandler = (handler: HotkeyHandler) =>
  Prec.highest(
    keymap.of([
      {
        key: 'Mod-s',
        preventDefault: true,
        run: newUpdaterCmd(handler.onShare),
      },
      {
        key: 'Mod-Enter',
        preventDefault: true,
        run: newUpdaterCmd(handler.onRun),
      },
      {
        key: 'Mod-f',
        preventDefault: true,
        run: newUpdaterCmd(handler.onFormat),
      },
    ]),
  )
