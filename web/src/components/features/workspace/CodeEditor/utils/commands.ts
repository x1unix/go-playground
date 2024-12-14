import * as monaco from 'monaco-editor'
import { runFileDispatcher, type StateDispatch } from '~/store'
import { dispatchFormatFile, dispatchResetWorkspace, dispatchShareSnippet } from '~/store/workspace'

/**
 * MonacoDIContainer is undocumented DI service container of monaco editor.
 */
interface MonacoDIContainer {
  get: <T>(svc) => T
}

interface HotkeyAction {
  keybinding: number
  callback: (editorInstance: monaco.editor.IStandaloneCodeEditor, di?: MonacoDIContainer) => void
}

/**
 * createActionAlias returns an action that triggers other monaco action.
 * @param keybinding Hotkeys
 * @param action Action name
 */
const createActionAlias = (keybinding: number, action: string): HotkeyAction => ({
  keybinding,
  callback: async (ed) => await ed.getAction(action)?.run(),
})

/**
 * Builtin custom actions
 */
const commands: HotkeyAction[] = [
  createActionAlias(monaco.KeyMod.Shift | monaco.KeyCode.Enter, 'editor.action.insertLineAfter'),
]

export const attachCustomCommands = (editorInstance: monaco.editor.IStandaloneCodeEditor) => {
  commands.forEach(({ keybinding, callback }) =>
    editorInstance.addCommand(keybinding, (di) => {
      callback(editorInstance, di)
    }),
  )
}

const debounced = <TArg>(fn: (arg: TArg) => void, delay: number) => {
  let tid: ReturnType<typeof setTimeout> | undefined

  return (arg: TArg) => {
    if (tid) {
      clearTimeout(tid)
    }

    tid = setTimeout(fn, delay, arg)
  }
}

export const registerEditorActions = (editor: monaco.editor.IStandaloneCodeEditor, dispatcher: StateDispatch) => {
  const dispatchDebounce = debounced(dispatcher, 750)

  const actions = [
    {
      id: 'clear',
      label: 'Reset contents',
      contextMenuGroupId: 'navigation',
      run: () => {
        dispatcher(dispatchResetWorkspace)
      },
    },
    {
      id: 'run-code',
      label: 'Build And Run Code',
      contextMenuGroupId: 'navigation',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
      run: () => {
        dispatcher(runFileDispatcher)
      },
    },
    {
      id: 'format-code',
      label: 'Format Code (goimports)',
      contextMenuGroupId: 'navigation',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyF],
      run: () => {
        dispatcher(dispatchFormatFile())
      },
    },
    {
      id: 'share',
      label: 'Share Snippet',
      contextMenuGroupId: 'navigation',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS],
      run: () => {
        dispatchDebounce(dispatchShareSnippet())
      },
    },
  ]

  actions.forEach((action) => editor.addAction(action))
}
