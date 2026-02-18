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

import type { EditorProps } from './props'
import type { EditorRemote } from './types'
import { BufferStateStore } from './state'

const styles: React.CSSProperties = {
  width: '100%',
  height: '100%',
  position: 'relative',
  overflow: 'hidden',
}

interface State {
  isLoading: boolean
}

export class Editor extends React.Component<EditorProps, State> {
  private readonly containerRef = React.createRef<HTMLDivElement>()
  private readonly extensions: Extension[]
  private readonly buffMgr: BufferStateStore
  private remote?: EditorRemote
  private editor?: EditorView

  state: State = {
    isLoading: false,
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

      this.props.onChange?.(path, update.state.doc)
    })

    // Initialize extensions for a current buffer.
    // TODO: impl hotkeys and minimap
    this.extensions = [
      newReadOnlyCompartment(),
      newInputModeCompartment(inputMode),
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
      newThemeCompartment(theme),
      newLspCompartment(),
      changeHandlerExt,
    ]
  }

  render() {
    return <div ref={this.containerRef} className="gpg-editor" style={styles} />
  }
}
