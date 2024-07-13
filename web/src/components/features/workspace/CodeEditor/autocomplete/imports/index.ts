import type * as monaco from 'monaco-editor'

export class GoImportsCompletionProvider implements monaco.languages.CompletionItemProvider {
  async provideCompletionItems(
    model: monaco.editor.ITextModel,
    position: monaco.Position,
    context: monaco.languages.CompletionContext,
    token: monaco.CancellationToken,
  ): Promise<monaco.languages.CompletionList> {
    const textUntilPosition = model.getValueInRange({
      startLineNumber: position.lineNumber,
      startColumn: 1,
      endLineNumber: position.lineNumber,
      endColumn: position.column,
    })

    console.log('prov', textUntilPosition)
    return { suggestions: [] }
  }
}
