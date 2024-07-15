import type * as monaco from 'monaco-editor'
import type { StateDispatch } from '~/store'
import { newAddNotificationAction, newRemoveNotificationAction, NotificationType } from '~/store/notifications'
import { goCompletionService } from '~/services/completion'

// allow incomplete inline imports as well
const inlineImportRegex = /^import\s+([\w_|.]+\s)?"((\S+)?")?$/
const importPackageRegex = /^\s+?([\w_|.]+\s)?"\S+"$/
const importGroupRegex = /^import\s?\(\s?$/
const emptyLineOrCommentRegex = /^\s+$|^\s?\/\//

const notificationId = 'GoImportsListLoad'
const emptySuggestions = { suggestions: [] }
/**
 * Go standard and third-party packages list provider.
 */
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
      return emptySuggestions
    }

    const shouldDisplayPreloader = !goCompletionService.isWarmUp()

    try {
      if (shouldDisplayPreloader) {
        this.showLoadingProgress()
      }

      const suggestions = await goCompletionService.getImportSuggestions()

      if (shouldDisplayPreloader) {
        this.dispatch(newRemoveNotificationAction(notificationId))
      }

      return { suggestions }
    } catch (err) {
      console.error(err)
      this.showErrorMessage(err)
      return emptySuggestions
    }
    // const { lineNumber, column } = position
    // const textUntilPosition = model.getValueInRange({
    //   startLineNumber: lineNumber,
    //   startColumn: 1,
    //   endLineNumber: lineNumber,
    //   endColumn: column,
    // })

    // console.log('prov', {
    //   textUntilPosition,
    //   isImportStmt,
    //   context,
    // })

    // const range: monaco.IRange = {
    //   startLineNumber: lineNumber,
    //   endLineNumber: lineNumber,
    //   startColumn: column,
    //   endColumn: column,
    // }
    // const suggestions: monaco.languages.CompletionItem[] = [
    //   {
    //     label: 'fmt',
    //     kind: monaco.languages.CompletionItemKind.Module,
    //     insertText: 'fmt',
    //     detail: 'fmt',
    //     documentation: {
    //       value:
    //         'Package os provides a platform-independent interface to operating system\nfunctionality. The design is Unix-like, although the error handling is\nGo-like; failing calls return values of type error rather than error numbers.\nOften, more information is available within the error. For example,\nif a call that takes a file name fails, such as Open or Stat, the error\nwill include the failing file name when printed and will be of type\n*PathError, which may be unpacked for more information.\n\nThe os interface is intended to be uniform across all operating systems.\nFeatures not generally available appear in the system-specific package syscall.\n\nHere is a simple example, opening a file and reading some of it.\n\n```\nfile, err := os.Open("file.go") // For read access.\nif err != nil {\n\tlog.Fatal(err)\n}\n\n```\nIf the open fails, the error string will be self-explanatory, like\n\n```\nopen file.go: no such file or directory\n\n```\nThe file\'s data can then be read into a slice of bytes. Read and\nWrite take their byte counts from the length of the argument slice.\n\n```\ndata := make([]byte, 100)\ncount, err := file.Read(data)\nif err != nil {\n\tlog.Fatal(err)\n}\nfmt.Printf("read %d bytes: %q\\n", count, data[:count])\n\n```\nNote: The maximum number of concurrent operations on a File may be limited by\nthe OS or the system. The number should be high, but exceeding it may degrade\nperformance or cause other issues.\n\n["os" on pkg.go.dev](https://pkg.go.dev/os)',
    //     },
    //   },
    //   {
    //     label: 'os',
    //     kind: monaco.languages.CompletionItemKind.Module,
    //     insertText: 'os',
    //   },
    // ].map((v) => ({ ...v, range }))
    // return { suggestions }
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

  private showLoadingProgress() {
    this.dispatch(
      newAddNotificationAction({
        id: notificationId,
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

  private showErrorMessage(err: any) {
    this.dispatch(
      newAddNotificationAction({
        id: notificationId,
        type: NotificationType.Error,
        title: 'Failed to download Go package index',
        description: 'message' in err ? err.message : `${err}`,
        canDismiss: true,
      }),
    )
  }
}
