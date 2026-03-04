import { Prec } from '@codemirror/state'
import { EditorView, type Command, keymap } from '@codemirror/view'
import { Vim } from '@replit/codemirror-vim'

import { type DocumentState, CommandType } from '../types'
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

type DocumentCommand = CommandType.Run | CommandType.Format | CommandType.Share
export type DocumentCommandHandler = (cmd: DocumentCommand, doc: DocumentState) => void

const newCmdHandler = (cmd: DocumentCommand, cb: DocumentCommandHandler): Command | undefined => {
  return (view) => {
    const doc = docStateFromEditor(view.state)
    if (doc) {
      // Dispatch command only on initialized buffers.
      cb(cmd, doc)
    }

    return true
  }
}

/**
 * Returns a new hotkey plugin that handles editor settings.
 */
export const newHotkeyHandler = (handler: DocumentCommandHandler) =>
  Prec.highest(
    keymap.of([
      {
        key: 'Mod-s',
        preventDefault: true,
        run: newCmdHandler(CommandType.Share, handler),
      },
      {
        key: 'Mod-Enter',
        preventDefault: true,
        run: newCmdHandler(CommandType.Run, handler),
      },
      {
        key: 'Mod-f',
        preventDefault: true,
        run: newCmdHandler(CommandType.Format, handler),
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

const commands: { cmd: DocumentCommand; name: string; short?: string }[] = [
  {
    cmd: CommandType.Run,
    name: 'write',
    short: 'w',
  },
  {
    cmd: CommandType.Share,
    name: 'share',
  },
]

/**
 * Registers custom vim commands and maps them to regular mode hotkeys.
 *
 * Note: this is a global operation.
 */
export const registerVimCommands = (handler: DocumentCommandHandler) => {
  for (const c of commands) {
    Vim.defineEx(c.name, c.short, (cm, _p) => {
      const doc = docStateFromEditor(cm.cm6.state)
      if (doc) {
        handler(c.cmd, doc)
      }
    })
  }
}
