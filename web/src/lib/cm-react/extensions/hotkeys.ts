import { Prec } from '@codemirror/state'
import { EditorView, type Command, keymap } from '@codemirror/view'
import { Vim } from '@replit/codemirror-vim'

import { type CommandHandler, type EditorRemote, EditorCommand } from '../types'
import { docStateFromEditor } from '../utils'

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))
const roundToTenth = (value: number) => Math.round(value * 10) / 10

const FONT_MAX = 42
const FONT_MIN = 7
const FONT_SCALE_STEP = 1.4

const arithmeticFontScale = (current: number, direction: number) => {
  const stepped = current + direction * FONT_SCALE_STEP
  const bounded = clamp(stepped, FONT_MIN, FONT_MAX)
  return roundToTenth(bounded)
}

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

interface ZoomListenParams {
  currentSize: () => number
  handler: (newSize: number) => void
}

/**
 * Registers a handler to capture Ctrl|Meta+MouseWheel commands to increase or decrease font size.
 *
 * Note: font update logic should be implemented on editor consumer side, as handler only performs event report logic.
 */
export const newEditorZoomListener = ({ currentSize, handler }: ZoomListenParams) => {
  return EditorView.domEventHandlers({
    wheel: (event) => {
      if (!event.ctrlKey && !event.metaKey) {
        return false
      }

      if (event.deltaY === 0) {
        return false
      }

      event.preventDefault()
      const direction = event.deltaY < 0 ? 1 : -1
      const current = currentSize()
      const nextSize = arithmeticFontScale(current, direction)
      if (nextSize != current) {
        handler(nextSize)
      }

      return true
    },
  })
}

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
