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

import type { EditorProps } from './props'
import type { EditorRemote } from './types'
import { BufferStateStore } from './buffers/store'

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
      newReadOnlyCompartment(),
      newInputModeCompartment(preferences?.inputMode),
      newStateDataFieldExtension(() => this.props),
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
      newThemeCompartment(preferences?.colorScheme),
      changeHandlerExt,
    ]
  }

  render() {
    return <div ref={this.containerRef} className="gpg-editor" style={styles} />
  }
}
