import { Prec } from '@codemirror/state'
import { type Command, keymap } from '@codemirror/view'

import { type HotkeyHandler, EditorRemote, HotkeyCommand } from '../types'
import { getBufferState } from '../buffers/state'

const newCmdHandler = (cmd: HotkeyCommand, remote: EditorRemote, fn?: HotkeyHandler): Command | undefined => {
  if (!fn) return

  return (view) => {
    const buff = getBufferState(view.state)
    if (buff.isInitialised && buff.fileName) {
      // Dispatch command only on initialized buffers.
      const doc = {
        path: buff.fileName,
        text: view.state.doc,
      }
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
