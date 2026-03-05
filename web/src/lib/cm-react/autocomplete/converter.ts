import type * as monaco from 'monaco-editor'
import type { Text } from '@codemirror/state'

import type { CompletionItem, CompletionTextEdit, HoverResult } from '../types/autocomplete'
import { offsetFromLineColumn } from './utils'

const SNIPPET_RULE = 4

const completionTypeByKind: Record<number, string | undefined> = {
  0: 'method',
  1: 'function',
  2: 'constructor',
  3: 'field',
  4: 'variable',
  5: 'class',
  6: 'struct',
  7: 'interface',
  8: 'module',
  9: 'property',
  10: 'event',
  11: 'operator',
  12: 'unit',
  13: 'value',
  14: 'constant',
  15: 'enum',
  16: 'enumMember',
  17: 'keyword',
  18: 'text',
  19: 'color',
  20: 'file',
  21: 'reference',
  23: 'folder',
  24: 'typeParameter',
  27: 'snippet',
}

type MonacoRange = monaco.IRange
type MonacoCompletionItem = monaco.languages.CompletionItem

const isCompletionRangePair = (
  range: MonacoCompletionItem['range'],
): range is monaco.languages.CompletionItemRanges => {
  return typeof range === 'object' && range !== null && 'insert' in range && 'replace' in range
}

const markdownToString = (value?: string | monaco.IMarkdownString): string | undefined => {
  if (!value) {
    return undefined
  }

  if (typeof value === 'string') {
    return value
  }

  return value.value
}

const markedStringToString = (item: string | monaco.IMarkdownString): string => {
  if (typeof item === 'string') {
    return item
  }

  if ('value' in item) {
    return item.value
  }

  return ''
}

const labelToString = (label: MonacoCompletionItem['label']) => {
  if (typeof label === 'string') {
    return label
  }

  return label.label
}

const rangeToOffsets = (doc: Text, range: MonacoRange) => ({
  from: offsetFromLineColumn(doc, range.startLineNumber, range.startColumn),
  to: offsetFromLineColumn(doc, range.endLineNumber, range.endColumn),
})

const textEditFromOperation = (doc: Text, edit: monaco.editor.ISingleEditOperation): CompletionTextEdit | null => {
  if (!edit.range) {
    return null
  }

  const { from, to } = rangeToOffsets(doc, edit.range)
  return {
    from,
    to,
    insert: edit.text ?? '',
  }
}

export const completionFromMonacoItem = (
  doc: Text,
  item: MonacoCompletionItem,
  fallbackRange: { from: number; to: number },
): CompletionItem => {
  let replaceFrom = fallbackRange.from
  let replaceTo = fallbackRange.to

  if (item.range) {
    const range = isCompletionRangePair(item.range) ? item.range.replace : item.range
    const offsets = rangeToOffsets(doc, range)
    replaceFrom = offsets.from
    replaceTo = offsets.to
  }

  const additionalTextEdits = item.additionalTextEdits
    ?.map((edit) => textEditFromOperation(doc, edit))
    .filter((edit): edit is CompletionTextEdit => !!edit)

  return {
    label: labelToString(item.label),
    detail: item.detail,
    documentation: markdownToString(item.documentation),
    type: completionTypeByKind[item.kind],
    sortText: item.sortText,
    filterText: item.filterText,
    insertText: item.insertText,
    isSnippet: !!(item.insertTextRules && (item.insertTextRules & SNIPPET_RULE) === SNIPPET_RULE),
    replaceFrom,
    replaceTo,
    additionalTextEdits: additionalTextEdits?.length ? additionalTextEdits : undefined,
  }
}

export const hoverFromMonaco = (hover: monaco.languages.Hover, doc: Text): HoverResult | null => {
  if (!hover.contents.length || !hover.range) {
    return null
  }

  const { from, to } = rangeToOffsets(doc, hover.range)
  return {
    from,
    to,
    contents: hover.contents,
  }
}
