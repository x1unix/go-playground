import React, { useEffect, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import type { AnyAction } from 'redux'
import {
  defaultEditorPreferences,
  Editor,
  type EditorPreferences,
  type Document,
  EventType,
  type EditorEvent,
  type EditorCommand,
  CommandType,
  type EditorRemote,
  LoadState,
  newGoAutocompleteSource,
} from '~/lib/cm-react'
import { useLazyRef } from '~/hooks/lazy-ref'
import type { State } from '~/store/state'
import { VimMode, VimSubMode } from '~/store/vim/state'
import { newVimDisposeAction, newVimModeChangeAction } from '~/store/vim/actions'
import { dispatchFormatFile, dispatchShareSnippet, dispatchUpdateFile } from '~/store/workspace'
import { GoSyntaxLinter } from './syntax/linter'
import { TargetType } from '~/services/config'
import { getDefaultFontFamily, getFontFamily } from '~/services/fonts'
import {
  Dispatcher,
  newCursorPositionChangeDispatcher,
  newMonacoParamsChangeDispatcher,
  runFileDispatcher,
} from '~/store'
import { useDebouncer } from '~/hooks/debounce'
import { newAddNotificationAction, newRemoveNotificationAction, NotificationType } from '~/store/notifications'
import { spawnLanguageWorker } from '~/workers/language'

const goImportsLoadNotification = 'GoImportsListLoad'

const preferencesWithDefaults = (src: Partial<EditorPreferences>): EditorPreferences =>
  Object.assign(Object.create(defaultEditorPreferences), src)

const mapEventToAction = (e: EditorEvent): AnyAction | Dispatcher | undefined => {
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
    case EventType.CompletionSourceStatus: {
      switch (e.status) {
        case LoadState.Error:
          return newAddNotificationAction({
            id: goImportsLoadNotification,
            type: NotificationType.Error,
            title: 'Failed to download Go package index',
            description: e.error,
            canDismiss: true,
          })
        case LoadState.Loading:
          return newAddNotificationAction({
            id: goImportsLoadNotification,
            type: NotificationType.None,
            title: 'Go Packages Index',
            description: 'Downloading Go packages index...',
            canDismiss: false,
            progress: {
              indeterminate: true,
            },
          })
        case LoadState.Loaded:
          return newRemoveNotificationAction(goImportsLoadNotification)
        default:
          return
      }
    }
    case EventType.CursorPositionChanged: {
      return newCursorPositionChangeDispatcher(e.position)
    }
    default:
      break
  }
}

const mapCommandToAction = (e: EditorCommand, rem: EditorRemote): AnyAction | Dispatcher | undefined => {
  switch (e.type) {
    case CommandType.EditorZoom:
      return newMonacoParamsChangeDispatcher({
        fontSize: e.newSize,
      })
    case CommandType.Run:
      return runFileDispatcher
    case CommandType.Format:
      return dispatchFormatFile()
    case CommandType.Share:
      return dispatchShareSnippet()
    default:
  }
}

/**
 * Connects CodeMirror code editor to the application store and business logic.
 */
export const CodeEditorContainer: React.FC = () => {
  const dispatch = useDispatch()
  const saveDebouncer = useDebouncer(150)

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
        fontFamily: monaco.fontFamily ? getFontFamily(monaco.fontFamily) : getDefaultFontFamily(),
        fontSize: monaco.fontSize ?? defaultEditorPreferences.fontSize,
        tabSize: monaco.tabSize,
        fontLigatures: monaco.fontLigatures,
        vimUseSystemClipboard: monaco.vimUseSystemClipboard,
        vimUseRelativeLineNumbers: monaco.vimUseRelativeLineNumbers,
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
  const autocompleteRef = useLazyRef(() => {
    const [worker, disposer] = spawnLanguageWorker()
    const source = newGoAutocompleteSource(worker)

    return {
      source,
      dispose: () => {
        source.dispose?.()
        disposer.dispose()
      },
    }
  })

  useEffect(() => {
    const v = linterRef.current
    return () => v.dispose()
  }, [linterRef])

  useEffect(() => {
    const v = autocompleteRef.current
    return () => v.dispose()
  }, [autocompleteRef])

  return (
    <Editor
      workspaceKey={workspace.generation}
      value={doc}
      preferences={preferences}
      readonly={isReadOnly}
      linter={{
        delay: 300,
        handler: (doc) => linterRef.current.check(doc, { warnAboutFakeDateTime: isServerRuntime }),
      }}
      autocomplete={autocompleteRef.current.source}
      onChange={({ path, text }) => {
        saveDebouncer(() => {
          dispatch(dispatchUpdateFile(path, text.toString()))
        })
      }}
      onEvent={(e) => {
        const action = mapEventToAction(e)
        if (action) {
          dispatch(action)
        }
      }}
      onCommand={(cmd, rem) => {
        const action = mapCommandToAction(cmd, rem)
        if (action) {
          dispatch(action)
        }
      }}
    />
  )
}

export default CodeEditorContainer
