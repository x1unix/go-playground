import { editor } from 'monaco-editor';
import * as monaco from "monaco-editor";

/**
 * MonacoDIContainer is undocumented DI service container of monaco editor.
 */
interface MonacoDIContainer {
  get: <T>(svc) => T
}

interface HotkeyAction {
  keybinding: number,
  callback: (editorInstance: editor.IStandaloneCodeEditor, di?: MonacoDIContainer) => void
}

/**
 * createActionAlias returns an action that triggers other monaco action.
 * @param keybinding Hotkeys
 * @param action Action name
 */
const createActionAlias = (keybinding: number, action: string): HotkeyAction => ({
  keybinding, callback: (ed) => ed.getAction(action)?.run()
})

/**
 * Builtin custom actions
 */
const commands: HotkeyAction[] = [
  createActionAlias(
    monaco.KeyMod.Shift | monaco.KeyCode.Enter,
    'editor.action.insertLineAfter'
  ),
];

export const attachCustomCommands = (editorInstance: editor.IStandaloneCodeEditor) => {
  commands.forEach(({keybinding, callback}) =>
    editorInstance.addCommand(keybinding, (di) => callback(editorInstance, di)))
}
