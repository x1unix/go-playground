import React, { useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { defaultEditorPreferences, Editor, type EditorPreferences, type Document, EventType } from '~/lib/cm-react'
import type { State } from '~/store/state'
import { dispatchUpdateFile } from '~/store/workspace'

const preferencesWithDefaults = (src: Partial<EditorPreferences>): EditorPreferences =>
  Object.assign(Object.create(defaultEditorPreferences), src)

/**
 * Connects CodeMirror code editor to the application store and business logic.
 */
export const CodeEditorContainer: React.FC = () => {
  const [fallbackWorkspaceKey] = useState(() => Date.now().toString())

  const dispatch = useDispatch()
  const monaco = useSelector((state: State) => state.monaco)
  const settings = useSelector((state: State) => state.settings)
  const workspace = useSelector((state: State) => state.workspace)
  const isReadOnly = useSelector(({ status }: State) => status?.loading || status?.running)

  const preferences: EditorPreferences = useMemo(
    () =>
      preferencesWithDefaults({
        colorScheme: settings.darkMode ? 'dark' : 'light',
        inputMode: settings.enableVimMode ? 'vim' : 'default',
        fontFamily: monaco.fontFamily,
        fontSize: monaco.fontSize ?? defaultEditorPreferences.fontSize,
        tabSize: monaco.tabSize,
      }),
    [settings, monaco],
  )

  const doc: Document | undefined = useMemo(() => {
    const { selectedFile, files } = workspace

    if (selectedFile && files) {
      return {
        path: selectedFile,
        content: files[selectedFile],
      }
    }
  }, [workspace])

  // TODO: I'll map props later myself.
  return (
    <Editor
      workspaceKey={workspace.snippet?.id ?? fallbackWorkspaceKey}
      value={doc}
      preferences={preferences}
      readonly={isReadOnly}
      onChange={({ path, text }) => {
        // TODO: probably debounde that
        dispatch(dispatchUpdateFile(path, text.toString()))
      }}
      onMount={(rem) => {
        console.log('got remote', rem)
      }}
      onEvent={(e) => {
        switch (e.type) {
          case EventType.VimModeChanged:
            console.log('vim.mode', e.mode, e.subMode)
            break
          default:
            console.log('got event', e)
        }
        // TODO: handle input events later
      }}
      onHotkeyCommand={(cmd, doc, rem) => {
        // TODO: handle commands later
        console.log('got cmd', { cmd, doc, rem })
      }}
    />
  )
}
