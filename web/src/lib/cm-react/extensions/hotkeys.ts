import { Prec } from '@codemirror/state'
import { type Command, keymap } from '@codemirror/view'
import { Vim } from '@replit/codemirror-vim'

import { type CommandHandler, type EditorRemote, EditorCommand } from '../types'
import { docStateFromEditor } from '../utils'

const newCmdHandler = (cmd: EditorCommand, remote: EditorRemote, fn?: CommandHandler): Command | undefined => {
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
export const newHotkeyHandler = (remote: EditorRemote, handler: CommandHandler) =>
  Prec.highest(
    keymap.of([
      {
        key: 'Mod-s',
        preventDefault: true,
        run: newCmdHandler(EditorCommand.Share, remote, handler),
      },
      {
        key: 'Mod-Enter',
        preventDefault: true,
        run: newCmdHandler(EditorCommand.Run, remote, handler),
      },
      {
        key: 'Mod-f',
        preventDefault: true,
        run: newCmdHandler(EditorCommand.Format, remote, handler),
      },
    ]),
  )

const commands = [
  {
    cmd: EditorCommand.Run,
    name: 'write',
    short: 'w',
  },
  {
    cmd: EditorCommand.Share,
    name: 'share',
  },
]

/**
 * Registers custom vim commands and maps them to regular mode hotkeys.
 *
 * Note: this is a global operation.
 */
export const registerVimCommands = (remote: EditorRemote, handler: CommandHandler) => {
  for (const c of commands) {
    Vim.defineEx(c.name, c.short, (cm, _p) => {
      const doc = docStateFromEditor(cm.cm6.state)
      if (doc) {
        handler(c.cmd, doc, remote)
      }
    })
  }
}
