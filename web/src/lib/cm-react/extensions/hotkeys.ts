import { Prec } from '@codemirror/state'
import { type Command, keymap } from '@codemirror/view'

import { type HotkeyHandler, type EditorRemote, HotkeyCommand } from '../types'
import { docStateFromEditor } from '../utils'

const newCmdHandler = (cmd: HotkeyCommand, remote: EditorRemote, fn?: HotkeyHandler): Command | undefined => {
  if (!fn) return

  return (view) => {
    const doc = docStateFromEditor(view.state)
    if (doc) {
      // Dispatch command only on initialized buffers.
      fn(cmd, doc, remote)
    }

    return true
  }
}

/**
 * Returns a new hotkey plugin that handles editor settings.
 */
export const newHotkeyHandler = (remote: EditorRemote, handler: HotkeyHandler) =>
  Prec.highest(
    keymap.of([
      {
        key: 'Mod-s',
        preventDefault: true,
        run: newCmdHandler(HotkeyCommand.Share, remote, handler),
      },
      {
        key: 'Mod-Enter',
        preventDefault: true,
        run: newCmdHandler(HotkeyCommand.Run, remote, handler),
      },
      {
        key: 'Mod-f',
        preventDefault: true,
        run: newCmdHandler(HotkeyCommand.Format, remote, handler),
      },
    ]),
  )
