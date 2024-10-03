import type * as monaco from 'monaco-editor'
import { CacheBasedCompletionProvider } from '../base'

// allow incomplete inline imports as well
const inlineImportRegex = /^import\s+([\w_|.]+\s)?"((\S+)?")?$/
const importPackageRegex = /^\s+?([\w_|.]+\s)?"\S+"$/
const importGroupRegex = /^import\s?\(\s?$/
const emptyLineOrCommentRegex = /^\s+$|^\s?\/\//

/**
 * Provides completions for import paths inside `import` clause.
 */
export class GoImportsCompletionProvider extends CacheBasedCompletionProvider<boolean> {
  triggerCharacters = ['"']

  protected async querySuggestions(_: boolean): Promise<monaco.languages.CompletionItem[]> {
    const suggestions = await this.completionSvc.getImportSuggestions()
    return suggestions
  }

  protected parseCompletionQuery(
    model: monaco.editor.ITextModel,
    position: monaco.Position,
    _context: monaco.languages.CompletionContext,
    _token: monaco.CancellationToken,
  ): boolean | null {
    const isImportStmt = this.isImportStatementRange(position, model)
    if (!isImportStmt) {
      return null
    }

    return true
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
}
