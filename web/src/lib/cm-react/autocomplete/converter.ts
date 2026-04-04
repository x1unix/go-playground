import type { Text } from '@codemirror/state'
import {
  CompletionItemKind,
  type CompletionItem as LSPCompletionItem,
  type Hover,
  type InsertReplaceEdit,
  type Position,
  type Range,
} from 'vscode-languageserver-protocol'

import type { CompletionItem, HoverResult } from '../types/autocomplete'
import { offsetFromLineColumn } from './utils'

export type CMCompletionType =
  | 'method'
  | 'function'
  | 'constructor'
  | 'field'
  | 'variable'
  | 'class'
  | 'struct'
  | 'interface'
  | 'module'
  | 'property'
  | 'event'
  | 'operator'
  | 'unit'
  | 'value'
  | 'constant'
  | 'enum'
  | 'enumMember'
  | 'keyword'
  | 'text'
  | 'color'
  | 'file'
  | 'reference'
  | 'folder'
  | 'typeParameter'
  | 'snippet'

const completionTypeByKind: Record<number, CMCompletionType | undefined> = {
  [CompletionItemKind.Method]: 'method',
  [CompletionItemKind.Function]: 'function',
  [CompletionItemKind.Constructor]: 'constructor',
  [CompletionItemKind.Field]: 'field',
  [CompletionItemKind.Variable]: 'variable',
  [CompletionItemKind.Class]: 'class',
  [CompletionItemKind.Struct]: 'struct',
  [CompletionItemKind.Interface]: 'interface',
  [CompletionItemKind.Module]: 'module',
  [CompletionItemKind.Property]: 'property',
  [CompletionItemKind.Event]: 'event',
  [CompletionItemKind.Operator]: 'operator',
  [CompletionItemKind.Unit]: 'unit',
  [CompletionItemKind.Value]: 'value',
  [CompletionItemKind.Constant]: 'constant',
  [CompletionItemKind.Enum]: 'enum',
  [CompletionItemKind.EnumMember]: 'enumMember',
  [CompletionItemKind.Keyword]: 'keyword',
  [CompletionItemKind.Text]: 'text',
  [CompletionItemKind.Color]: 'color',
  [CompletionItemKind.File]: 'file',
  [CompletionItemKind.Reference]: 'reference',
  [CompletionItemKind.Folder]: 'folder',
  [CompletionItemKind.TypeParameter]: 'typeParameter',
  [CompletionItemKind.Snippet]: 'snippet',
}

export const completionTypeFromKind = (kind?: number) =>
  typeof kind === 'number' ? completionTypeByKind[kind] : undefined

const isInsertReplaceEdit = (edit: LSPCompletionItem['textEdit']): edit is InsertReplaceEdit => {
  return typeof edit === 'object' && edit !== null && 'insert' in edit && 'replace' in edit
}

const positionToOffset = (doc: Text, position: Position) => {
  // LSP positions are zero-based (line/character), while CodeMirror helpers use one-based
  // line/column numbers, so we shift both values by +1 during conversion.
  return offsetFromLineColumn(doc, position.line + 1, position.character + 1)
}

const rangeToOffsets = (doc: Text, range: Range) => ({
  from: positionToOffset(doc, range.start),
  to: positionToOffset(doc, range.end),
})

export const completionFromLSPItem = (
  doc: Text,
  item: LSPCompletionItem,
  fallbackRange: { from: number; to: number },
): CompletionItem => {
  let replaceFrom = fallbackRange.from
  let replaceTo = fallbackRange.to

  if (item.textEdit) {
    const range = isInsertReplaceEdit(item.textEdit) ? item.textEdit.replace : item.textEdit.range
    const offsets = rangeToOffsets(doc, range)
    replaceFrom = offsets.from
    replaceTo = offsets.to
  }

  const additionalTextEdits = item.additionalTextEdits

  const insertText = item.insertText ?? (item.textEdit ? item.textEdit.newText : item.label)

  return {
    ...item,
    insertText,
    insertTextFormat: item.insertTextFormat,
    replaceFrom,
    replaceTo,
    additionalTextEdits: additionalTextEdits?.length ? additionalTextEdits : undefined,
  }
}

export const hoverFromLSP = (hover: Hover, doc: Text): HoverResult | null => {
  if (!hover.range || hover.contents === '' || (Array.isArray(hover.contents) && hover.contents.length === 0)) {
    return null
  }

  const { from, to } = rangeToOffsets(doc, hover.range)
  return {
    from,
    to,
    contents: hover.contents,
  }
}
