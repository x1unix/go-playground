import {
  autocompletion,
  snippet,
  type Completion,
  type CompletionContext,
  type CompletionResult as CMCompletionResult,
} from '@codemirror/autocomplete'
import { type Extension } from '@codemirror/state'
import { hoverTooltip, type Tooltip } from '@codemirror/view'

import { LoadState } from '../types/events'
import { docStateFromEditor } from '../utils'
import type { CompletionItem, CompletionResult, EditorAutocompleteSource, HoverResult } from './types'
import { cursorFromOffset } from './utils'

interface SourceExtensionArgs {
  source: () => EditorAutocompleteSource | undefined
  isCurrentPath: (path: string) => boolean
  onStatus?: (status: LoadState, error?: string) => void
}

const normalizeError = (err: unknown) => {
  if (err instanceof Error) {
    return err.message
  }

  return String(err)
}

const toCompletionOption = (item: CompletionItem): Completion => ({
  label: item.label,
  detail: item.detail,
  info: item.documentation,
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
})

const toCompletionResult = (result: CompletionResult | null): CMCompletionResult | null => {
  if (!result || result.options.length === 0) {
    return null
  }

  return {
    from: result.from,
    to: result.to,
    options: result.options.map(toCompletionOption),
  }
}

const toTooltip = ({ from, to, contents }: HoverResult): Tooltip => ({
  pos: from,
  end: to,
  above: true,
  create: () => {
    const dom = document.createElement('div')
    dom.className = 'cm-gpg-hover'
    dom.style.whiteSpace = 'pre-wrap'
    dom.textContent = contents.join('\n\n')

    return { dom }
  },
})

const completionSource =
  ({ source, isCurrentPath, onStatus }: SourceExtensionArgs) =>
  async (context: CompletionContext): Promise<CMCompletionResult | null> => {
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

      return toCompletionResult(result)
    } catch (err) {
      if (!isCurrentPath(requestPath)) {
        return null
      }

      onStatus?.(LoadState.Error, normalizeError(err))
      return null
    }
  }

export const newAutocompleteExtensions = ({ source, isCurrentPath, onStatus }: SourceExtensionArgs): Extension[] => {
  const completion = autocompletion({
    override: [completionSource({ source, isCurrentPath, onStatus })],
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

      return toTooltip(result)
    } catch (_) {
      return null
    }
  })

  return [completion, hover]
}
