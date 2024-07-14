import type * as monaco from 'monaco-editor'
import type { StateDispatch } from '~/store'
import { newAddNotificationAction, NotificationType } from '~/store/notifications'

// allow incomplete inline imports as well
const inlineImportRegex = /^import\s+([\w_|.]+\s)?"((\S+)?")?$/
const importPackageRegex = /^\s+?([\w_|.]+\s)?"\S+"$/
const importGroupRegex = /^import\s?\(\s?$/
const emptyLineOrCommentRegex = /^\s+$|^\s?\/\//

export class GoImportsCompletionProvider implements monaco.languages.CompletionItemProvider {
  // private isUpdatingIndex = false
  triggerCharacters = ['"']

  constructor(private readonly dispatch: StateDispatch) {}
  async provideCompletionItems(
    model: monaco.editor.ITextModel,
    position: monaco.Position,
    context: monaco.languages.CompletionContext,
    token: monaco.CancellationToken,
  ): Promise<monaco.languages.CompletionList> {
    const isImportStmt = this.isImportStatementRange(position, model)
    if (!isImportStmt) {
      return { suggestions: [] }
    }

    const textUntilPosition = model.getValueInRange({
      startLineNumber: position.lineNumber,
      startColumn: 1,
      endLineNumber: position.lineNumber,
      endColumn: position.column,
    })

    console.log('prov', {
      textUntilPosition,
      isImportStmt,
      context,
    })

    return { suggestions: [] }
  }

  private isImportStatementRange(pos: monaco.Position, model: monaco.editor.ITextModel) {
    // Very unoptimized, stupid and doesn't cover edge cases but might work for start.
    const line = model.getLineContent(pos.lineNumber)
    if (inlineImportRegex.test(line)) {
      return true
    }

    // try locate nearest import block
    for (let i = pos.lineNumber - 1; i > 0; i--) {
      const line = model.getLineContent(i)

      if (line.match(importPackageRegex) || line.match(importGroupRegex)) {
        return true
      }

      if (line.match(emptyLineOrCommentRegex)) {
        // maybe there is an empty line or comment, skip to next
        continue
      }

      return false
    }

    return false
  }

  private async updateIndex() {
    this.dispatch(
      newAddNotificationAction({
        id: 'test',
        type: NotificationType.None,
        title: 'Go Packages Index',
        description: 'Downloading Go packages index...',
        canDismiss: false,
        progress: {
          indeterminate: true,
        },
      }),
    )
  }
}
