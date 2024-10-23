import React from 'react'
import { Spinner } from '@fluentui/react'
import MonacoEditor, { type Monaco } from '@monaco-editor/react'
import * as monaco from 'monaco-editor'

import { createVimModeAdapter, type StatusBarAdapter, type VimModeKeymap } from '~/plugins/vim/editor'
import { type MonacoSettings, TargetType } from '~/services/config'
import { connect, newMonacoParamsChangeDispatcher, type StateDispatch, type State } from '~/store'
import { type WorkspaceState, dispatchUpdateFile } from '~/store/workspace'
import type { VimState } from '~/store/vim/state'
import { spawnLanguageWorker } from '~/workers/language'
import { GoSyntaxChecker } from './syntaxcheck'
import { debounce } from './utils/utils'
import { attachCustomCommands, registerEditorActions } from './utils/commands'
import { stateToOptions } from './utils/props'
import { configureMonacoLoader } from './utils/loader'
import { DocumentMetadataCache, registerGoLanguageProviders } from './autocomplete'
import { languageFromFilename, registerExtraLanguages } from './grammar'
import classes from './CodeEditor.module.css'

// ask monaco-editor/react to use our own Monaco instance.
configureMonacoLoader()

const defaultTabSize = 4

export interface CodeEditorState {
  code?: string
  loading?: boolean
  fileName: string
  projectId: string
  darkMode: boolean
  vimModeEnabled: boolean
  isServerEnvironment: boolean
  options: MonacoSettings
  vim?: VimState | null
}

export interface Props extends CodeEditorState {
  dispatch: StateDispatch
}

class CodeEditorView extends React.Component<Props> {
  private syntaxChecker?: GoSyntaxChecker
  private editor?: monaco.editor.IStandaloneCodeEditor
  private vimAdapter?: VimModeKeymap
  private vimCommandAdapter?: StatusBarAdapter
  private monaco?: Monaco
  private saveTimeoutId?: ReturnType<typeof setTimeout>
  private readonly disposables: monaco.IDisposable[] = []
  private readonly metadataCache = new DocumentMetadataCache()

  private addDisposer(...disposers: monaco.IDisposable[]) {
    this.disposables.push(...disposers)
  }

  private readonly persistFontSize = debounce((fontSize: number) => {
    this.props.dispatch(
      newMonacoParamsChangeDispatcher({
        fontSize,
      }),
    )
  }, 1000)

  private configureEditorOverrides(editor: monaco.editor.IStandaloneCodeEditor) {
    const { tabSize = defaultTabSize, fontSize } = this.props.options
    const opts: Parameters<monaco.editor.IStandaloneCodeEditor['updateOptions']>[0] = {
      detectIndentation: false, // required to override tab sizes
      tabSize,
    }

    // Font should be set only once during boot as when font size changes
    // by zoom and editor config object is updated - this cause infinite
    // font change calls with random values.
    if (fontSize) {
      opts.fontSize = fontSize
    }

    editor.updateOptions(opts)
  }

  editorDidMount(editor: monaco.editor.IStandaloneCodeEditor, monacoInstance: Monaco) {
    this.configureEditorOverrides(editor)
    this.syntaxChecker = new GoSyntaxChecker(this.props.dispatch)
    const [langWorker, workerDisposer] = spawnLanguageWorker()

    this.addDisposer(workerDisposer, this.syntaxChecker, registerExtraLanguages())
    this.addDisposer(...registerGoLanguageProviders(this.props.dispatch, this.metadataCache, langWorker))
    this.editor = editor
    this.monaco = monacoInstance

    editor.onKeyDown((e) => this.onKeyDown(e))
    const [vimAdapter, statusAdapter] = createVimModeAdapter(this.props.dispatch, editor)
    this.vimAdapter = vimAdapter
    this.vimCommandAdapter = statusAdapter

    if (this.props.vimModeEnabled) {
      console.log('Vim mode enabled')
      this.vimAdapter.attach()
    }

    // Persist font size on zoom
    this.addDisposer(
      editor.onDidChangeConfiguration((e) => {
        if (e.hasChanged(monaco.editor.EditorOption.fontSize)) {
          const newFontSize = editor.getOption(monaco.editor.EditorOption.fontSize)
          this.persistFontSize(newFontSize)
        }
      }),
    )

    // Register custom actions
    registerEditorActions(editor, this.props.dispatch)
    attachCustomCommands(editor)
    editor.focus()

    this.updateModelMarkers()
  }

  private updateModelMarkers() {
    this.syntaxChecker?.requestModelMarkers(this.editor?.getModel(), this.editor, {
      isServerEnvironment: this.props.isServerEnvironment,
    })
  }

  private isFileOrEnvironmentChanged(prevProps: Props) {
    return (
      prevProps.isServerEnvironment !== this.props.isServerEnvironment || prevProps.fileName !== this.props.fileName
    )
  }

  private applyVimModeChanges(prevProps: Props) {
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
    const projectChanged = prevProps.projectId !== this.props.projectId
    if (projectChanged) {
      this.metadataCache.flush()
    }

    if (this.isFileOrEnvironmentChanged(prevProps)) {
      // Update editor markers on file or environment changes
      this.updateModelMarkers()
    }

    // HACK: tab size field in prevProps might be a new val instead of prev.
    // Workaround by comparing a reference.
    const configChanged = prevProps.options !== this.props.options
    if (configChanged) {
      this.editor?.updateOptions({
        tabSize: this.props.options.tabSize ?? defaultTabSize,
      })
    }

    this.applyVimModeChanges(prevProps)
  }

  componentWillUnmount() {
    this.disposables?.forEach((d) => d.dispose())
    this.vimAdapter?.dispose()
    this.metadataCache.flush()

    if (!this.editor) {
      return
    }

    // Shutdown instance to avoid dangling markers.
    this.monaco?.editor.removeAllMarkers(this.editor.getId())
    this.monaco?.editor.getModels().forEach((m) => m.dispose())
    this.editor.dispose()
  }

  onChange(newValue: string | undefined, e: monaco.editor.IModelContentChangedEvent) {
    if (!newValue) {
      this.metadataCache.flush(this.props.fileName)
      return
    }

    const { fileName } = this.props
    this.metadataCache.handleUpdate(fileName, e)
    this.updateModelMarkers()

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
        language={languageFromFilename(this.props.fileName)}
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

const mapStateToProps = ({ workspace, ...s }: State): CodeEditorState => ({
  ...mapWorkspaceProps(workspace),
  darkMode: s.settings.darkMode,
  vimModeEnabled: s.settings.enableVimMode,
  isServerEnvironment: s.runTarget.target === TargetType.Server,
  loading: s.status?.loading,
  options: s.monaco,
  vim: s.vim,
})

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

export const CodeEditor = connect<CodeEditorState, {}>(mapStateToProps)(CodeEditorView)
