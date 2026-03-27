import {
  autocompletion,
  completeAnyWord,
  snippet,
  type Completion,
  type CompletionContext,
  type CompletionResult as CMCompletionResult,
} from '@codemirror/autocomplete'
import { syntaxTree } from '@codemirror/language'
import { Compartment, Facet, type Extension, type Text } from '@codemirror/state'
import { EditorView, hoverTooltip, type Tooltip } from '@codemirror/view'
import { InsertTextFormat, type TextEdit } from 'vscode-languageserver-protocol'

import type { CompletionItem, CompletionResult, EditorAutocompleteSource, HoverResult } from '../types/autocomplete'
import { LoadState } from '../types/events'
import { getBufferState } from '../buffers/state'
import { docStateFromEditor } from '../utils'
import { cursorFromOffset, offsetFromLineColumn } from './utils'
import { classNames, type PluginTheme } from './styles'
import { MarkupRenderer, renderCompletionDoc } from './doc-renderer'
import { completionTypeFromKind } from './converter'

export interface AutocompletePluginOptions {
  source: () => EditorAutocompleteSource | undefined
  isCurrentPath: (path: string) => boolean
  onStatus?: (status: LoadState, error?: string) => void
  theme?: PluginTheme
}

const rendererFacet = Facet.define<MarkupRenderer, MarkupRenderer>({
  combine: (values) => values[0] ?? new MarkupRenderer(),
})

const autocompleteThemeCompartment = new Compartment()

const makeAutocompleteThemeBundle = (theme?: PluginTheme): Extension[] => [
  rendererFacet.of(new MarkupRenderer(theme?.highlighter)),
  ...(theme?.styleSpec ? [EditorView.theme(theme.styleSpec)] : []),
]

export const newAutocompleteThemeCompartment = (theme?: PluginTheme): Extension =>
  autocompleteThemeCompartment.of(makeAutocompleteThemeBundle(theme))

export const updateAutocompleteThemeEffect = (theme: PluginTheme) =>
  autocompleteThemeCompartment.reconfigure(makeAutocompleteThemeBundle(theme))

const normalizeError = (err: unknown) => {
  if (err instanceof Error) {
    return err.message
  }

  return String(err)
}

const toCMChange = (doc: Text, { range, newText }: TextEdit) => ({
  from: offsetFromLineColumn(doc, range.start.line + 1, range.start.character + 1),
  to: offsetFromLineColumn(doc, range.end.line + 1, range.end.character + 1),
  insert: newText,
})

export const applyCompletionItem = (
  view: Pick<EditorView, 'state' | 'dispatch'>,
  completion: Completion | null,
  from: number,
  to: number,
  item: CompletionItem,
) => {
  // Completion providers may return their own replacement range. When absent,
  // fallback to the range CodeMirror gives us for the picked option.
  const replaceFrom = item.replaceFrom ?? from
  const replaceTo = item.replaceTo ?? to

  // LSP additionalTextEdits are line/column-based. Convert them to CodeMirror
  // offsets and sort so we can dispatch deterministic, valid multi-change specs.
  // CodeMirror applies arrays of changes in ascending order.
  const additionalChanges = (item.additionalTextEdits ?? [])
    .map((edit) => toCMChange(view.state.doc, edit))
    .sort((a, b) => a.from - b.from)

  if (item.insertTextFormat === InsertTextFormat.Snippet) {
    if (additionalChanges.length > 0) {
      // Snippet application must happen through CodeMirror's `snippet(...)`
      // helper so placeholders like ${1:name} become active fields.
      //
      // We first apply extra edits (typically auto-import edits), then map the
      // original replacement range through those edits, because document offsets
      // may shift before we insert the snippet text.
      const update = view.state.update({
        changes: additionalChanges,
        // This event name is intentionally aligned with CodeMirror's own
        // completion transactions (`insertCompletionText` / snippet accept).
        // It is not arbitrary: downstream logic can treat completion input
        // differently from regular typing.
        userEvent: 'input.complete',
      })

      // `assoc` controls which side to stick to when mapping through insertions:
      // - start uses -1 (left-associated)
      // - end uses +1 (right-associated)
      // This preserves a stable replacement span around the typed token.
      const mappedFrom = update.changes.mapPos(replaceFrom, -1)
      const mappedTo = update.changes.mapPos(replaceTo, 1)
      view.dispatch(update)
      snippet(item.insertText)(view, completion, mappedFrom, mappedTo)
      return
    }

    // Fast path: no extra edits, so we can apply the snippet directly.
    snippet(item.insertText)(view, completion, replaceFrom, replaceTo)
    return
  }

  // Plain-text completion path: merge additional edits and main insertion into
  // a single atomic transaction, sorted by start offset.
  const changes = [...additionalChanges, { from: replaceFrom, to: replaceTo, insert: item.insertText }].sort(
    (a, b) => a.from - b.from,
  )

  view.dispatch({
    changes,
    userEvent: 'input.complete',
  })
}

class AutocompletePlugin {
  constructor(private readonly opts: AutocompletePluginOptions) {}

  private toCompletionOption(item: CompletionItem, renderer: MarkupRenderer): Completion {
    return {
      label: item.label,
      detail: item.detail,
      type: completionTypeFromKind(item.kind),
      info: () => renderCompletionDoc(renderer, item.documentation),
      apply: (view, completion, from, to) => {
        applyCompletionItem(view, completion, from, to, item)
      },
    }
  }

  private toCompletionResult(result: CompletionResult | null, renderer: MarkupRenderer): CMCompletionResult | null {
    if (!result || result.options.length === 0) {
      return null
    }

    return {
      from: result.from,
      to: result.to,
      options: result.options.map((item) => this.toCompletionOption(item, renderer)),
    }
  }

  private toTooltip({ from, to, contents }: HoverResult, renderer: MarkupRenderer): Tooltip {
    return {
      pos: from,
      end: to,
      above: true,
      create: () => {
        const dom = document.createElement('div')
        dom.className = classNames.tooltip
        renderer.renderContents(dom, contents)
        return { dom }
      },
    }
  }

  private buildCompletionSource() {
    const { source, isCurrentPath, onStatus } = this.opts
    return async (context: CompletionContext): Promise<CMCompletionResult | null> => {
      const currentSource = source()
      const syntax = getBufferState(context.state).syntax
      if (!currentSource?.supportsSyntax(syntax)) {
        return null
      }

      const doc = docStateFromEditor(context.state)
      if (!doc) {
        return null
      }

      const requestPath = doc.path
      const cursor = cursorFromOffset(doc.text, context.pos)

      try {
        const result = await currentSource.complete({
          document: doc,
          cursor,
          explicit: context.explicit,
          tree: syntaxTree(context.state),
        })

        if (!isCurrentPath(requestPath)) {
          return null
        }

        return this.toCompletionResult(result, context.state.facet(rendererFacet))
      } catch (err) {
        if (!isCurrentPath(requestPath)) {
          return null
        }

        onStatus?.(LoadState.Error, normalizeError(err))
        return null
      }
    }
  }

  getExtensions(): Extension[] {
    const { source, isCurrentPath } = this.opts

    const completion = autocompletion({
      override: [this.buildCompletionSource(), completeAnyWord],
    })

    const hover = hoverTooltip(async (view, pos) => {
      const currentSource = source()
      const syntax = getBufferState(view.state).syntax
      if (!currentSource?.supportsSyntax(syntax)) {
        return null
      }

      const doc = docStateFromEditor(view.state)
      if (!doc) {
        return null
      }

      const requestPath = doc.path
      try {
        const result = await currentSource.hover({
          document: doc,
          cursor: cursorFromOffset(doc.text, pos),
          tree: syntaxTree(view.state),
        })

        if (!result || !isCurrentPath(requestPath)) {
          return null
        }

        return this.toTooltip(result, view.state.facet(rendererFacet))
      } catch (_) {
        return null
      }
    })

    return [newAutocompleteThemeCompartment(this.opts.theme), completion, hover]
  }
}

export const newAutocompleteExtensions = (args: AutocompletePluginOptions): Extension[] => {
  return new AutocompletePlugin(args).getExtensions()
}
