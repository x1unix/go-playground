import type * as monaco from 'monaco-editor'
import type { GoCompletionService } from '~/services/completion'
import type { DocumentMetadataCache } from '../cache'
import { queryFromPosition } from './parse'

export class GoHoverProvider implements monaco.languages.HoverProvider {
  private builtins?: Set<string>

  constructor(
    protected completionSvc: GoCompletionService,
    protected metadataCache: DocumentMetadataCache,
  ) {}

  async provideHover(model: monaco.editor.ITextModel, position: monaco.Position, token: monaco.CancellationToken) {
    const query = queryFromPosition(model, position)
    if (!query) {
      return null
    }

    // Skip resolution of unknown literals.
    const isLiteral = !('packageName' in query)
    if (isLiteral) {
      if (!this.builtins) {
        this.builtins = new Set(await this.completionSvc.getBuiltinNames())
      }

      if (!this.builtins.has(query.value)) {
        return null
      }
    }

    const { startColumn, endColumn } = query.range
    const imports = this.metadataCache.getMetadata(model.uri.path, model)
    const hoverValue = await this.completionSvc.getHoverValue({
      ...query,
      context: {
        imports,
        range: {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn,
          endColumn,
        },
      },
    })

    if (!hoverValue) {
      return null
    }

    return hoverValue
  }
}
