import React, { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import type { AnyAction } from 'redux'
import {
  defaultEditorPreferences,
  Editor,
  type EditorPreferences,
  type Document,
  EventType,
  type EditorEvent,
} from '~/lib/cm-react'
import { useLazyRef } from '~/hooks/lazy-ref'
import type { State } from '~/store/state'
import { VimMode, VimSubMode } from '~/store/vim/state'
import { newVimDisposeAction, newVimModeChangeAction } from '~/store/vim/actions'
import { dispatchUpdateFile } from '~/store/workspace'
import { GoSyntaxLinter } from './linter'
import { TargetType } from '~/services/config'
import { linter } from '@codemirror/lint'

const preferencesWithDefaults = (src: Partial<EditorPreferences>): EditorPreferences =>
  Object.assign(Object.create(defaultEditorPreferences), src)

const mapEventToAction = (e: EditorEvent): AnyAction | undefined => {
  switch (e.type) {
    // TODO: wire vim command events when callbacks will be fixed.
    case EventType.VimModeChanged:
      return newVimModeChangeAction({
        mode: e.mode as VimMode,
        subMode: e.subMode as VimSubMode,
      })
    case EventType.InputModeChanged:
      switch ('vim') {
        case e.prevMode:
          return newVimDisposeAction()
        case e.mode:
          return newVimModeChangeAction({ mode: VimMode.Normal })
      }
      break
    default:
      // TODO: wire up cursor position events when it will be implemented on UI and store.
      break
  }
}

/**
 * Connects CodeMirror code editor to the application store and business logic.
 */
export const CodeEditorContainer: React.FC = () => {
  const dispatch = useDispatch()
  const [fallbackWorkspaceKey] = useState(() => Date.now().toString())

  const monaco = useSelector((state: State) => state.monaco)
  const settings = useSelector((state: State) => state.settings)
  const workspace = useSelector((state: State) => state.workspace)
  const isReadOnly = useSelector(({ status }: State) => status?.loading || status?.running)
  const isServerRuntime = useSelector(({ runTarget }: State) => runTarget.target === TargetType.Server)

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

  const linterRef = useLazyRef(() => new GoSyntaxLinter(dispatch))
  useEffect(() => {
    const v = linterRef.current
    return () => v.dispose()
  }, [linterRef])

  // TODO: I'll map props later myself.
  return (
    <Editor
      workspaceKey={workspace.snippet?.id ?? fallbackWorkspaceKey}
      value={doc}
      preferences={preferences}
      readonly={isReadOnly}
      linter={{
        delay: 100,
        handler: (doc) => linterRef.current.check(doc, { warnAboutFakeDateTime: isServerRuntime }),
      }}
      onChange={({ path, text }) => {
        // TODO: probably debounce that later
        dispatch(dispatchUpdateFile(path, text.toString()))
      }}
      onMount={(rem) => {
        console.log('got remote', rem)
      }}
      onEvent={(e) => {
        const action = mapEventToAction(e)
        if (action) {
          dispatch(action)
        }
      }}
      onCommand={(cmd, doc, rem) => {
        // TODO: handle commands later
        console.log('got cmd', { cmd, doc, rem })
      }}
    />
  )
}
