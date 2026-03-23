import {
  autocompletion,
  completeAnyWord,
  snippet,
  type Completion,
  type CompletionContext,
  type CompletionResult as CMCompletionResult,
} from '@codemirror/autocomplete'
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

class AutocompletePlugin {
  constructor(private readonly opts: AutocompletePluginOptions) {}

  private toCompletionOption(item: CompletionItem, renderer: MarkupRenderer): Completion {
    return {
      label: item.label,
      detail: item.detail,
      type: completionTypeFromKind(item.kind),
      info: () => renderCompletionDoc(renderer, item.documentation),
      apply: (view, completion, from, to) => {
        const replaceFrom = item.replaceFrom ?? from
        const replaceTo = item.replaceTo ?? to

        if (item.insertTextFormat === InsertTextFormat.Snippet && !item.additionalTextEdits?.length) {
          snippet(item.insertText)(view, completion, replaceFrom, replaceTo)
          return
        }

        const changes = [
          ...(item.additionalTextEdits ?? []).map((edit) => toCMChange(view.state.doc, edit)),
          { from: replaceFrom, to: replaceTo, insert: item.insertText },
        ].sort((a, b) => a.from - b.from)

        view.dispatch({
          changes,
          userEvent: 'input.complete',
        })
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
      const warmUp = await currentSource.isWarmUp()
      if (!warmUp) {
        onStatus?.(LoadState.Loading)
      }

      try {
        const result = await currentSource.complete({
          document: doc,
          cursor,
          explicit: context.explicit,
        })

        if (!isCurrentPath(requestPath)) {
          return null
        }

        if (!warmUp) {
          onStatus?.(LoadState.Loaded)
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
