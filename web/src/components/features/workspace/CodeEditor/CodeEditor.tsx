import React from 'react'
import { Spinner } from '@fluentui/react'
import MonacoEditor, { type Monaco } from '@monaco-editor/react'
import * as monaco from 'monaco-editor'

import { createVimModeAdapter, type StatusBarAdapter, type VimModeKeymap } from '~/plugins/vim/editor'
import { Analyzer } from '~/services/analyzer'
import { type MonacoSettings, TargetType } from '~/services/config'
import {
  connect,
  newMarkerAction,
  newMonacoParamsChangeDispatcher,
  runFileDispatcher,
  type StateDispatch,
} from '~/store'
import { type WorkspaceState, dispatchFormatFile, dispatchResetWorkspace, dispatchUpdateFile } from '~/store/workspace'
import { getTimeNowUsageMarkers, asyncDebounce, debounce } from './utils'
import { attachCustomCommands } from './commands'
import { LANGUAGE_GOLANG, stateToOptions } from './props'
import { configureMonacoLoader } from './loader'
import { DocumentMetadataCache, registerGoLanguageProviders } from './autocomplete'
import type { VimState } from '~/store/vim/state'
import classes from './CodeEditor.module.css'

const ANALYZE_DEBOUNCE_TIME = 500

// ask monaco-editor/react to use our own Monaco instance.
configureMonacoLoader()

const mapWorkspaceProps = ({ files, selectedFile, snippet }: WorkspaceState) => {
  const projectId = snippet?.id ?? ''
  if (!selectedFile) {
    return {
      projectId,
      code: '',
      fileName: '',
    }
  }

  return {
    projectId,
    code: files?.[selectedFile],
    fileName: selectedFile,
  }
}

interface CodeEditorState {
  code?: string
  loading?: boolean
  fileName: string
  projectId: string
}

interface Props extends CodeEditorState {
  darkMode: boolean
  vimModeEnabled: boolean
  isServerEnvironment: boolean
  options: MonacoSettings
  vim?: VimState | null
  dispatch: StateDispatch
}

class CodeEditor extends React.Component<Props> {
  private analyzer?: Analyzer
  private editorInstance?: monaco.editor.IStandaloneCodeEditor
  private vimAdapter?: VimModeKeymap
  private vimCommandAdapter?: StatusBarAdapter
  private monaco?: Monaco
  private disposables?: monaco.IDisposable[]
  private saveTimeoutId?: ReturnType<typeof setTimeout>
  private readonly metadataCache = new DocumentMetadataCache()

  private readonly debouncedAnalyzeFunc = asyncDebounce(async (fileName: string, code: string) => {
    return await this.doAnalyze(fileName, code)
  }, ANALYZE_DEBOUNCE_TIME)

  private readonly persistFontSize = debounce((fontSize: number) => {
    this.props.dispatch(
      newMonacoParamsChangeDispatcher({
        fontSize,
      }),
    )
  }, 1000)

  editorDidMount(editorInstance: monaco.editor.IStandaloneCodeEditor, monacoInstance: Monaco) {
    this.disposables = registerGoLanguageProviders(this.props.dispatch, this.metadataCache)
    this.editorInstance = editorInstance
    this.monaco = monacoInstance

    editorInstance.onKeyDown((e) => this.onKeyDown(e))
    const [vimAdapter, statusAdapter] = createVimModeAdapter(this.props.dispatch, editorInstance)
    this.vimAdapter = vimAdapter
    this.vimCommandAdapter = statusAdapter

    // Font should be set only once during boot as when font size changes
    // by zoom and editor config object is updated - this cause infinite
    // font change calls with random values.
    if (this.props.options.fontSize) {
      editorInstance.updateOptions({
        fontSize: this.props.options.fontSize,
      })
    }

    if (this.props.vimModeEnabled) {
      console.log('Vim mode enabled')
      this.vimAdapter.attach()
    }

    if (Analyzer.supported()) {
      this.analyzer = new Analyzer()
    } else {
      console.info('Analyzer requires WebAssembly support')
    }

    const actions = [
      {
        id: 'clear',
        label: 'Reset contents',
        contextMenuGroupId: 'navigation',
        run: () => {
          this.props.dispatch(dispatchResetWorkspace)
        },
      },
      {
        id: 'run-code',
        label: 'Build And Run Code',
        contextMenuGroupId: 'navigation',
        keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
        run: () => {
          this.props.dispatch(runFileDispatcher)
        },
      },
      {
        id: 'format-code',
        label: 'Format Code (goimports)',
        contextMenuGroupId: 'navigation',
        keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyF],
        run: () => {
          this.props.dispatch(dispatchFormatFile())
        },
      },
    ]

    // Persist font size on zoom
    this.disposables.push(
      editorInstance.onDidChangeConfiguration((e) => {
        if (e.hasChanged(monaco.editor.EditorOption.fontSize)) {
          const newFontSize = editorInstance.getOption(monaco.editor.EditorOption.fontSize)
          this.persistFontSize(newFontSize)
        }
      }),
    )

    // Register custom actions
    actions.forEach((action) => editorInstance.addAction(action))
    attachCustomCommands(editorInstance)
    editorInstance.focus()

    const { fileName, code } = this.props
    void this.debouncedAnalyzeFunc(fileName, code)
  }

  private isFileOrEnvironmentChanged(prevProps) {
    return (
      prevProps.isServerEnvironment !== this.props.isServerEnvironment || prevProps.fileName !== this.props.fileName
    )
  }

  private applyVimModeChanges(prevProps) {
    if (prevProps?.vimModeEnabled === this.props.vimModeEnabled) {
      return
    }

    if (this.props.vimModeEnabled) {
      console.log('Vim mode enabled')
      this.vimAdapter?.attach()
      return
    }

    console.log('Vim mode disabled')
    this.vimAdapter?.dispose()
  }

  componentDidUpdate(prevProps: Props) {
    if (prevProps.projectId !== this.props.projectId) {
      this.metadataCache.flush()
    }

    if (this.isFileOrEnvironmentChanged(prevProps)) {
      // Update editor markers on file or environment changes
      void this.debouncedAnalyzeFunc(this.props.fileName, this.props.code)
    }

    this.applyVimModeChanges(prevProps)
  }

  componentWillUnmount() {
    this.disposables?.forEach((d) => d.dispose())
    this.analyzer?.dispose()
    this.vimAdapter?.dispose()
    this.metadataCache.flush()

    if (!this.editorInstance) {
      return
    }

    // Shutdown instance to avoid dangling markers.
    this.monaco?.editor.removeAllMarkers(this.editorInstance.getId())
    this.monaco?.editor.getModels().forEach((m) => m.dispose())
    this.editorInstance.dispose()
  }

  onChange(newValue: string | undefined, e: monaco.editor.IModelContentChangedEvent) {
    if (!newValue) {
      this.metadataCache.flush(this.props.fileName)
      return
    }

    const { fileName, code } = this.props
    this.metadataCache.handleUpdate(fileName, e)
    void this.debouncedAnalyzeFunc(fileName, code)

    // HACK: delay state updates to workaround cursor reset on completion.
    //
    // Some completion items may contain additional text edit commands.
    // Accepting such completion trigger multiple document edit events in a row.
    // Each edit event triggers Redux store update which causes re-render.
    //
    // Store update occurs before last change is applied.
    // This causes race condition and cursor reset bug.
    if (this.saveTimeoutId) {
      clearTimeout(this.saveTimeoutId)
    }

    this.saveTimeoutId = setTimeout(() => {
      this.props.dispatch(dispatchUpdateFile(fileName, newValue))
    }, 100)
  }

  private async doAnalyze(fileName: string, code: string) {
    if (!fileName.endsWith('.go')) {
      // Ignore non-go files
      return
    }

    // Code analysis contains 2 steps that run on different conditions:
    // 1. Run Go worker if it's available and check for errors
    // 2. Add warnings to `time.Now` calls if code runs on server.
    const promises = [
      this.analyzer?.getMarkers(code) ?? null,
      this.props.isServerEnvironment ? Promise.resolve(getTimeNowUsageMarkers(code, this.editorInstance!)) : null,
    ].filter((p) => !!p)

    const results = await Promise.allSettled(promises)
    const markers = results.flatMap((r) => {
      // Can't do in beautiful way due of TS strict checks.
      if (r.status === 'rejected') {
        console.error(r.reason)
        return []
      }

      return r.value ?? []
    })

    if (!this.editorInstance) return
    this.monaco?.editor.setModelMarkers(this.editorInstance.getModel()!, this.editorInstance.getId(), markers)
    this.props.dispatch(newMarkerAction(fileName, markers))
  }

  private onKeyDown(e: monaco.IKeyboardEvent) {
    const { vimModeEnabled, vim } = this.props
    if (!vimModeEnabled || !vim?.commandStarted) {
      return
    }

    this.vimCommandAdapter?.handleKeyDownEvent(e, vim?.keyBuffer)
  }

  render() {
    const options = stateToOptions(this.props.options)
    return (
      <MonacoEditor
        className={classes.CodeEditor}
        language={LANGUAGE_GOLANG}
        theme={this.props.darkMode ? 'vs-dark' : 'vs-light'}
        value={this.props.code}
        defaultValue={this.props.code}
        path={this.props.fileName}
        options={options}
        onChange={(newVal, e) => this.onChange(newVal, e)}
        onMount={(e, m) => this.editorDidMount(e, m)}
        loading={<Spinner key="spinner" label="Loading editor..." labelPosition="right" />}
      />
    )
  }
}

export const ConnectedCodeEditor = connect<CodeEditorState, {}>(({ workspace, ...s }) => ({
  ...mapWorkspaceProps(workspace),
  darkMode: s.settings.darkMode,
  vimModeEnabled: s.settings.enableVimMode,
  isServerEnvironment: s.runTarget.target === TargetType.Server,
  loading: s.status?.loading,
  options: s.monaco,
  vim: s.vim,
}))(CodeEditor)
