import {
  autocompletion,
  completeAnyWord,
  snippet,
  type Completion,
  type CompletionContext,
  type CompletionResult as CMCompletionResult,
} from '@codemirror/autocomplete'
import { type Extension } from '@codemirror/state'
import { EditorView, hoverTooltip, type Tooltip } from '@codemirror/view'

import type { CompletionItem, CompletionResult, EditorAutocompleteSource, HoverResult } from '../types/autocomplete'
import { LoadState } from '../types/events'
import { docStateFromEditor } from '../utils'
import { cursorFromOffset } from './utils'
import { classNames, coreStyles, type PluginTheme } from './styles'
import { MarkupRenderer, renderCompletionDoc } from './doc-renderer'

export interface AutocompletePluginOptions {
  source: () => EditorAutocompleteSource | undefined
  isCurrentPath: (path: string) => boolean
  onStatus?: (status: LoadState, error?: string) => void
  theme?: PluginTheme
}

const normalizeError = (err: unknown) => {
  if (err instanceof Error) {
    return err.message
  }

  return String(err)
}

class AutocompletePlugin {
  private readonly renderer: MarkupRenderer

  constructor(private readonly opts: AutocompletePluginOptions) {
    this.renderer = new MarkupRenderer(opts.theme?.highlighter)
  }

  private toCompletionOption(item: CompletionItem): Completion {
    return {
      label: item.label,
      detail: item.detail,
      info: () => renderCompletionDoc(this.renderer, item.documentation),
      type: item.type,
      apply: (view, completion, from, to) => {
        const replaceFrom = item.replaceFrom ?? from
        const replaceTo = item.replaceTo ?? to

        if (item.isSnippet && !item.additionalTextEdits?.length) {
          snippet(item.insertText)(view, completion, replaceFrom, replaceTo)
          return
        }

        const changes = [
          ...(item.additionalTextEdits ?? []),
          { from: replaceFrom, to: replaceTo, insert: item.insertText },
        ].sort((a, b) => a.from - b.from)

        view.dispatch({
          changes,
          userEvent: 'input.complete',
        })
      },
    }
  }

  private toCompletionResult(result: CompletionResult | null): CMCompletionResult | null {
    if (!result || result.options.length === 0) {
      return null
    }

    return {
      from: result.from,
      to: result.to,
      options: result.options.map((item) => this.toCompletionOption(item)),
    }
  }

  private toTooltip({ from, to, contents }: HoverResult): Tooltip {
    return {
      pos: from,
      end: to,
      above: true,
      create: () => {
        const dom = document.createElement('div')
        dom.className = classNames.tooltip
        this.renderer.renderContents(dom, contents)
        return { dom }
      },
    }
  }

  private buildCompletionSource() {
    const { source, isCurrentPath, onStatus } = this.opts
    return async (context: CompletionContext): Promise<CMCompletionResult | null> => {
      const currentSource = source()
      const doc = docStateFromEditor(context.state)
      if (!doc || !currentSource) {
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

        return this.toCompletionResult(result)
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
      const doc = docStateFromEditor(view.state)
      if (!doc || !currentSource) {
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

        return this.toTooltip(result)
      } catch (_) {
        return null
      }
    })

    return [EditorView.theme(this.opts.theme?.styleSpec ?? coreStyles), completion, hover]
  }
}

export const newAutocompleteExtensions = (args: AutocompletePluginOptions): Extension[] => {
  return new AutocompletePlugin(args).getExtensions()
}
