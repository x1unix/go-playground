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
    return await this.langWorker.getImportSuggestions()
  }

  protected parseCompletionQuery(
    model: monaco.editor.ITextModel,
    position: monaco.Position,
    _context: monaco.languages.CompletionContext,
    _token: monaco.CancellationToken,
  ): boolean | null {
    const isImportStmt = this.isImportStatementRange(model, position)
    if (!isImportStmt) {
      return null
    }

    return true
  }

  private isImportStatementRange(model: monaco.editor.ITextModel, pos: monaco.IPosition) {
    const meta = this.metadataCache.getMetadata(model)
    if (!meta.hasError && meta.totalRange) {
      const { startLineNumber: minLine, endLineNumber: maxLine } = meta.totalRange
      return pos.lineNumber >= minLine && pos.lineNumber <= maxLine
    }

    // Fallback if metadata can't be populated for some reason.
    const line = model.getLineContent(pos.lineNumber)
    if (inlineImportRegex.test(line)) {
      return true
    }

    // try to locate nearest import block
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
