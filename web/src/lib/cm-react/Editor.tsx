import React from 'react'

import { indentWithTab } from '@codemirror/commands'
import { EditorState, type Extension, type StateEffect } from '@codemirror/state'
import { EditorView, keymap, type ViewUpdate } from '@codemirror/view'
import { vscodeKeymap } from '@replit/codemirror-vscode-keymap'
import { getCM } from '@replit/codemirror-vim'

import { basicSetup } from './extensions/basic'
import { highlightField } from './extensions/highlight'
import { newInputModeCompartment } from './extensions/input'
import { newIndentationCompartment } from './extensions/indentation'
import { newBufferDiagnosticsRenderer } from './extensions/linter'
import { newReadOnlyCompartment } from './extensions/readonly'
import { newSyntaxCompartment } from './extensions/syntax'
import { defaultThemeStyles, newThemeCompartment } from './extensions/themes'
import { newEditorZoomListener, newHotkeyHandler, registerVimCommands } from './extensions/hotkeys'
import {
  newBufferStateFieldExtension,
  newBufferStateFromSnapshot,
  getBufferState,
  hasBufferState,
  setBufferStateEffect,
  checkBufferStateChanges,
} from './buffers/state'
import { BufferStateStore } from './buffers/store'

import { type EditorProps, type Document, defaultEditorPreferences } from './props'
import { EventType, type CommandHandler, type InputMode, type Position } from './types'
import { docFromString } from './utils'
import { CMEditorRemote } from './remote'
import type { BufferState } from './buffers/types'

import classes from './Editor.module.css'

const keyBindings = [indentWithTab, ...vscodeKeymap]
const corePlugins = [defaultThemeStyles, highlightField, keymap.of(keyBindings)]

interface State {
  isLoading: boolean
}

export class Editor extends React.Component<EditorProps, State> {
  private readonly containerRef = React.createRef<HTMLDivElement>()
  private readonly extensions: Extension[]
  private readonly buffMgr: BufferStateStore
  private remote: CMEditorRemote
  private editor?: EditorView

  state: State = {
    isLoading: false,
  }

  constructor(props: EditorProps) {
    super(props)

    const { store, preferences, value } = props
    this.buffMgr = store ?? new BufferStateStore()

    const changeHandlerExt = EditorView.updateListener.of((update) => {
      this.handleViewUpdate(update)
    })

    // Preinit remote as it is a dependency for extensions.
    this.remote = new CMEditorRemote(this.props.formatter)

    // Wrap hotkey listener to always point to current value from props.
    const h: CommandHandler = (...args) => {
      // always point to current props value.
      this.props.onCommand?.(...args)
    }

    // Create hotkey handler and register custom commands.
    const hotkeyHandler = newHotkeyHandler(this.remote, h)
    registerVimCommands(this.remote, h)

    // Initialize extensions for a current buffer.
    // TODO: impl minimap
    this.extensions = [
      hotkeyHandler, // Should be on top to avoid overlap with builtin keymap.
      newReadOnlyCompartment(props.readonly),
      newInputModeCompartment(preferences?.inputMode),
      newIndentationCompartment(preferences?.tabSize),
      newBufferStateFieldExtension(() => ({
        props: this.props,
      })),
      newBufferDiagnosticsRenderer(() => this.props.linter),
      ...basicSetup({
        lineNumbers: {
          domEventHandlers: {
            click: (view, line) => {
              this.props.onEvent?.({
                type: EventType.GutterClick,
                position: {
                  line: view.state.doc.lineAt(line.from).number,
                  column: 0,
                },
              })
              return true
            },
          },
        },
      }),
      newEditorZoomListener({
        currentSize: () => this.props.preferences?.fontSize ?? defaultEditorPreferences.fontSize,
        handler: (newSize) => {
          this.props.onEvent?.({
            type: EventType.EditorZoom,
            newSize: newSize,
          })
        },
      }),
      ...corePlugins,
      newSyntaxCompartment(value?.path),
      newThemeCompartment(preferences),
      changeHandlerExt,
    ]
  }

  private getInitialEditorState() {
    return EditorState.create({
      extensions: this.extensions,
    })
  }

  private editorStateForDocument(doc?: Document) {
    if (!doc) {
      // Reset as no active document but still keep extensions state from previous state.
      const stateData = newBufferStateFromSnapshot(this.editor?.state, undefined)
      const state = this.getInitialEditorState()
      return { state, stateData, isCached: false }
    }

    const { path, content } = doc
    const cachedState = this.buffMgr.get(path)
    if (cachedState && hasBufferState(cachedState)) {
      const stateData = getBufferState(cachedState)
      return { state: cachedState, stateData, isCached: true }
    }

    const state = EditorState.create({
      // CM require lines to be split manually.
      doc: docFromString(content),
      extensions: this.extensions,
    })

    // Extend document state data for a new file from a previous state.
    const stateData = newBufferStateFromSnapshot(this.editor?.state, path)
    return { state, stateData, isCached: false }
  }

  componentDidMount() {
    if (!this.containerRef.current) {
      return
    }

    const { value } = this.props
    this.editor = new EditorView({
      parent: this.containerRef.current,
      state: value && this.editorStateForDocument(value).state,
    })

    this.remote.setEditorView(this.editor)

    this.props.onMount?.(this.remote)

    // If BufferState field it not defined in EditorState, state will create
    // a new copy with current props every time it was queried instead of doing that just once per state.
    // This breaks change detection and to avoid that, we should explicitly set it every time.
    const effects: Array<StateEffect<any>> = [setBufferStateEffect(this.props)]

    this.editor.dispatch({
      effects,
    })

    // Emit initial events
    // TODO: broadcast per-document vim mode on document change.
    this.emitCursorPosChanged(this.editor?.state)
    this.onInputModeChanged(this.props.preferences?.inputMode ?? 'default')

    // Finally, focus.
    this.editor?.focus()
  }

  /**
   * Applies updates on EditorState based on prop changes.
   */
  componentDidUpdate(prevProps: Readonly<EditorProps>) {
    if (prevProps === this.props) {
      // Ignore re-render caused by setState for loading screen.
      return
    }

    if (this.state.isLoading || !this.editor) {
      // We can't do much without editor instance or when editor is loading required resources.
      return
    }

    let { value: prevFile } = prevProps
    const { value: newFile, formatter } = this.props

    this.remote.setFormatter(formatter)
    const workspaceChanged = prevProps.workspaceKey !== this.props.workspaceKey
    if (workspaceChanged) {
      this.buffMgr.clear()
      prevFile = undefined
    }

    const fileChanged = prevFile?.path !== newFile?.path

    if (!workspaceChanged && fileChanged && prevFile) {
      const { state } = this.editor
      // Ignore persist of previous state, if it's a default editor state (not from a file).
      // E.g. when made using getInitialEditorState().
      if (hasBufferState(this.editor.state)) {
        this.buffMgr.setState(prevFile.path, state)
      }
    }

    let currentStateData: BufferState
    if (fileChanged) {
      // getStateForFile creates a new, blank state for documents that weren't previously cached.
      // That means it should be called only during document switch.
      // Otherwise - change detector will always compare against a default state, triggering constant updates.
      const { state, stateData } = this.editorStateForDocument(newFile)
      currentStateData = stateData

      // Effects can be dispatched only on mounted
      this.editor.setState(state)
    } else {
      // Compare current state if document is not changed.
      currentStateData = getBufferState(this.editor.state)
    }

    const { effects, isChanged } = checkBufferStateChanges({
      props: this.props,
      buffState: currentStateData,
    })
    if (!isChanged) {
      return
    }

    this.editor.dispatch({ effects })

    // Check if input mode has been changed
    // skip if change triggered when compartment is updated in for a different file.
    const currentMode = this.props.preferences?.inputMode ?? 'default'
    const prevMode = currentStateData.preferences?.inputMode
    if (prevMode && currentMode !== prevMode) {
      this.onInputModeChanged(currentMode, prevMode)
    }

    if (fileChanged) {
      // Sync state cursor to status bar.
      this.emitCursorPosChanged(this.editor?.state)
      this.editor?.focus()
    }
  }

  private handleViewUpdate({ docChanged, selectionSet, state }: ViewUpdate) {
    if (selectionSet) {
      this.emitCursorPosChanged(state)
    }

    if (!docChanged) {
      return
    }

    const docState = getBufferState(state)
    if (!docState.isInitialised || !docState.fileName) {
      // Skip on-change hook for uninitialized buffers.
      return
    }

    if (docState.fileName !== this.props.value?.path) {
      console.warn('onChange was triggered for a file that is different from a selected current one', {
        current: this.props.value?.path,
        affected: docState.fileName,
      })
      return
    }

    this.props.onChange?.({
      path: docState.fileName,
      language: docState.syntax,
      text: state.doc,
    })
  }

  private emitCursorPosChanged(state?: EditorState) {
    const { onEvent } = this.props
    if (!onEvent) {
      return
    }

    let position: Position = {
      line: 0,
      column: 0,
    }

    if (state) {
      // See: https://discuss.codemirror.net/t/get-cursor-position-line-column/6519/3
      const { doc, selection } = state
      const cursor = doc.lineAt(selection.main.head)

      position = {
        line: cursor.number,
        column: selection.main.head - cursor.from,
      }
    }

    onEvent({
      type: EventType.CursorPositionChanged,
      position,
    })
  }

  private onInputModeChanged(currentMode: InputMode, prevMode?: InputMode) {
    this.props.onEvent?.({
      type: EventType.InputModeChanged,
      mode: currentMode,
      prevMode,
    })

    if (!this.editor) return

    switch (currentMode) {
      case 'vim': {
        const vimCm = getCM(this.editor)
        vimCm?.on('vim-mode-change', (e: { mode: string; subMode: string }) => {
          this.props.onEvent?.({
            type: EventType.VimModeChanged,
            ...e,
          })
        })

        // FIXME: command events are emitted on editor keypress, not a command key
        //
        // vimCm?.on('vim-keypress', (key: string) => {
        //   console.log('vim-keypress')
        //   this.props.onEvent?.({
        //     type: EventType.VimInputCommandPress,
        //     key,
        //   })
        // })
        //
        // vimCm?.on('vim-command-done', () => {
        //   console.log('vim-cmd-done')
        //   this.props.onEvent?.({
        //     type: EventType.VimInputCommandDone,
        //   })
        // })
        break
      }
      case 'emacs': {
        //TOOD: hook-up emacs events
        break
      }
      default:
        return
    }
  }

  render() {
    const prefs = this.props.preferences
    const theme = prefs?.colorScheme ?? 'light'
    return (
      <div
        ref={this.containerRef}
        className={classes['gpg-Editor']}
        data-theme={theme}
        data-font-ligatures={!!prefs?.fontLigatures}
      />
    )
  }
}
