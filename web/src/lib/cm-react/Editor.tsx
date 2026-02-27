import React from 'react'

import { indentWithTab } from '@codemirror/commands'
import { EditorState, type Extension, type StateEffect } from '@codemirror/state'
import { EditorView, keymap, type ViewUpdate } from '@codemirror/view'
import { vscodeKeymap } from '@replit/codemirror-vscode-keymap'

import { basicSetup } from './extensions/basic'
import { highlightField } from './extensions/highlight'
import { newInputModeCompartment } from './extensions/input'
import { newFormatErrorsRenderer } from './extensions/linter'
import { newReadOnlyCompartment } from './extensions/readonly'
import { newSyntaxCompartment } from './extensions/syntax'
import { defaultThemeStyles, newThemeCompartment } from './extensions/themes'
import { newHotkeyHandler } from './extensions/hotkeys'
import {
  newBufferStateFieldExtension,
  newBufferStateFromSnapshot,
  getBufferState,
  hasBufferState,
  setBufferStateEffect,
  checkBufferStateChanges,
} from './buffers/state'
import { BufferStateStore } from './buffers/store'

import type { EditorProps, Document } from './props'
import { EventType, Position } from './types'
import { docFromString } from './utils'
import { CMEditorRemote } from './remote'
import type { BufferState } from './buffers/types'
import { getCM } from '@replit/codemirror-vim'

const styles: React.CSSProperties = {
  width: '100%',
  height: '100%',
  position: 'relative',
  overflow: 'hidden',
}

const keyBindings = [indentWithTab, ...vscodeKeymap]
const corePlugins = [defaultThemeStyles, highlightField, keymap.of(keyBindings)]

interface State {
  isLoading: boolean
  configSeq: number
}

export class Editor extends React.Component<EditorProps, State> {
  private readonly containerRef = React.createRef<HTMLDivElement>()
  private readonly extensions: Extension[]
  private readonly buffMgr: BufferStateStore
  private remote: CMEditorRemote
  private editor?: EditorView

  state: State = {
    isLoading: false,
    configSeq: 0,
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
    const hotkeyHandler = newHotkeyHandler(this.remote, (...args) => {
      // always point to current props value.
      this.props.onHotkeyCommand?.(...args)
    })

    // Initialize extensions for a current buffer.
    // TODO: impl hotkeys and minimap
    this.extensions = [
      hotkeyHandler, // Should be on top to avoid overlap with builtin keymap.
      newReadOnlyCompartment(props.readonly),
      newInputModeCompartment(preferences?.inputMode),
      newBufferStateFieldExtension(() => ({
        seq: this.state.configSeq,
        props: this.props,
      })),
      newFormatErrorsRenderer(),
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
    const effects: Array<StateEffect<any>> = [setBufferStateEffect(this.state.configSeq, this.props)]

    this.editor.dispatch({
      effects,
    })
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

    const { effects, changes, isChanged } = checkBufferStateChanges({
      seq: this.state.configSeq,
      props: this.props,
      buffState: currentStateData,
    })
    if (!isChanged) {
      return
    }

    this.editor.dispatch({ effects })
    this.checkInputModeChanges(changes)

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

    // TODO: fetch affected file path from state ref.
    const path = this.props.value?.path
    if (!path) {
      return
    }

    this.props.onChange?.({
      path,
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

  private checkInputModeChanges(changes: Partial<BufferState>) {
    const currentMode = this.props.preferences?.inputMode ?? 'default'
    const prevMode = changes.preferences?.inputMode
    if (!prevMode || currentMode === prevMode) {
      // skip if change triggered when compartment is updated in for a different file.
      return
    }

    this.props.onEvent?.({
      type: EventType.InputModeChanged,
      mode: currentMode,
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

        vimCm?.on('vim-keypress', (key: string) => {
          this.props.onEvent?.({
            type: EventType.VimInputCommandPress,
            key,
          })
        })

        vimCm?.on('vim-command-done', () => {
          this.props.onEvent?.({
            type: EventType.VimInputCommandDone,
          })
        })
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
    return <div ref={this.containerRef} className="gpg-editor" style={styles} />
  }
}
