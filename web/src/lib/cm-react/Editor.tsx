import React from 'react'

import { indentWithTab } from '@codemirror/commands'
import { EditorState, type Extension, type StateEffect } from '@codemirror/state'
import { EditorView, keymap } from '@codemirror/view'
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
} from './buffers/state'
import { BufferStateStore } from './buffers/store'

import type { EditorProps, Document } from './props'
import type { EditorRemote } from './types'
import { docFromString } from './utils'

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
  private remote?: EditorRemote
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
      if (!update.docChanged) {
        return
      }

      // TODO: fetch affected file path from state ref.
      const path = this.props.value?.path
      if (!path) {
        return
      }

      this.props.onChange?.({
        path,
        text: update.state.doc,
      })
    })

    // Wrap hotkey listener to always point to current value from props.
    const hotkeyHandler = newHotkeyHandler({
      onShare: (s) => this.props.hotkeys?.onShare?.(s),
      onFormat: (s) => this.props.hotkeys?.onFormat?.(s),
      onRun: (s) => this.props.hotkeys?.onRun?.(s),
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
              this.props.onGutterClick?.({
                line: view.state.doc.lineAt(line.from).number,
                column: 0,
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

    const ctrl = new CMEditorController(this.editor, this.props.formatter)
    this.props.onMount?.(ctrl)
    this.remoteCtrl = ctrl

    // If StateData field it not defined in EditorState, state will create
    // a new copy with current props every time it was queried instead of doing that just once per state.
    // This breaks change detection and to avoid that, we should explicitly set it every time.
    const effects: Array<StateEffect<any>> = [setStateDataEffect(this.props)]

    // Initialize LSP client if possible.
    if (this.lspClient && lsp && value) {
      effects.push(
        updateLspExtensionEffect({
          // TODO: compute from state of props.
          ...defaultPluginOptions,
          languageId: 'gno',
          documentUri: `${lsp.rootUri}/${value.path}`,
          client: this.lspClient,
        }),
      )
    }

    this.editor.dispatch({
      effects,
    })
  }

  render() {
    return <div ref={this.containerRef} className="gpg-editor" style={styles} />
  }
}
