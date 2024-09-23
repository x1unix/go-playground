import { type CompletionItem, type CompletionRecord, CompletionRecordType } from '../storage/types'

const labelToString = (label: CompletionItem['label']) => (typeof label === 'string' ? label : label.label)
const getPrefix = (label: CompletionItem['label']) => labelToString(label)[0] ?? ''
const pkgNameFromImportPath = (importPath: string): string => {
  const slashPos = importPath.lastIndexOf('/')
  return slashPos === -1 ? importPath : importPath.slice(slashPos + 1)
}

export const buildCompletionRecord = (
  src: CompletionItem,
  recordType: CompletionRecordType,
  pkgName?: string,
): CompletionRecord => ({
  ...src,
  recordType,
  prefix: recordType === CompletionRecordType.Symbol ? getPrefix(src.label) : '',
  packageName: pkgName,
})

/**
 * Converts import path suggestions into package name suggestions.
 */
export const importRecordsIntoSymbols = (src: CompletionItem[]): CompletionRecord[] =>
  src.map(({ label, kind, documentation }) => {
    const importPath = labelToString(label)
    const pkgName = pkgNameFromImportPath(importPath)

    return buildCompletionRecord(
      {
        label: pkgName,
        detail: pkgName,
        kind,
        documentation,
        insertText: pkgName,
      } as any as CompletionItem,
      CompletionRecordType.Symbol,
    )
  })

export const completionRecordsFromMap = (m?: Record<string, CompletionItem[]>): CompletionRecord[] => {
  if (!m) {
    return []
  }

  return Object.entries(m)
    .map(([pkgName, entries]) =>
      entries.map((entry) => buildCompletionRecord(entry, CompletionRecordType.Symbol, pkgName)),
    )
    .flat()
}
