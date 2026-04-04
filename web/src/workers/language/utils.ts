import {
  CompletionItemKind,
  MarkupKind,
  type CompletionItem as LSPCompletionItem,
  type MarkedString,
  type MarkupContent,
  type TextEdit,
} from 'vscode-languageserver-protocol'
import { ImportClauseType, type Packages, type SuggestionContext, type Symbols, SymbolSourceKey } from './types'
import type { PackageIndexItem, SymbolIndexItem } from '~/services/storage/types'

const getPrefix = (str: string) => str[0]?.toLowerCase() ?? ''

const packageCompletionKind = CompletionItemKind.Module

const discardIfEmpty = (str: string, defaults?: string | undefined) => (str.length ? str : defaults)

const stringToMarkdown = (value: string): MarkupContent | undefined => {
  if (!value.length) {
    return undefined
  }

  return {
    kind: MarkupKind.Markdown,
    value,
  }
}

export const constructPackages = ({ names, paths, docs }: Packages): PackageIndexItem[] =>
  names.map((name, i) => ({
    name,
    importPath: paths[i],
    prefix: getPrefix(names[i]),
    documentation: stringToMarkdown(docs[i]),
  }))

export const constructSymbols = ({
  names,
  docs,
  details,
  signatures,
  insertTexts,
  insertTextRules,
  kinds,
  packages,
}: Symbols): SymbolIndexItem[] =>
  names.map((name, i) => ({
    key: `${packages[i][SymbolSourceKey.Path]}.${name}`,
    label: name,
    detail: discardIfEmpty(details[i], name),
    signature: signatures[i],
    kind: kinds[i],
    insertText: insertTexts[i],
    insertTextFormat: insertTextRules[i],
    prefix: getPrefix(name),
    packageName: packages[i][SymbolSourceKey.Name],
    packagePath: packages[i][SymbolSourceKey.Path],
    documentation: stringToMarkdown(docs[i]),
  }))

export const importCompletionFromPackage = ({
  importPath,
  name,
  documentation,
}: PackageIndexItem): LSPCompletionItem => ({
  label: importPath,
  documentation,
  detail: name,
  insertText: importPath,
  kind: packageCompletionKind,
})

const importPackageTextEdit = (importPath: string, { imports }: SuggestionContext): TextEdit[] | undefined => {
  if (!imports.range || imports.allPaths?.has(importPath)) {
    return undefined
  }

  switch (imports.blockType) {
    case ImportClauseType.None: {
      const text = `import "${importPath}"\n`
      return [
        {
          newText: imports.prependNewLine ? `\n${text}` : text,
          range: imports.range,
        },
      ]
    }
    case ImportClauseType.Single:
    case ImportClauseType.Block: {
      const importLines = (imports.blockPaths ?? [])
        .concat(importPath)
        .sort()
        .map((v) => `\t"${v}"`)
        .join('\n')

      return [
        {
          newText: `import (\n${importLines}\n)`,
          range: imports.range,
        },
      ]
    }
  }
}

export const completionFromPackage = (
  { importPath, name, documentation }: PackageIndexItem,
  ctx: SuggestionContext,
): LSPCompletionItem => ({
  label: name,
  documentation,
  detail: importPath,
  insertText: name,
  kind: packageCompletionKind,
  textEdit: {
    range: ctx.range,
    newText: name,
  },
  additionalTextEdits: importPackageTextEdit(importPath, ctx),
})

export const completionFromSymbol = (
  {
    packagePath,
    key: _key,
    prefix: _prefix,
    packageName: _packageName,
    signature: _signature,
    ...completionItem
  }: SymbolIndexItem,
  ctx: SuggestionContext,
  textEdits: boolean,
): LSPCompletionItem => {
  const existingData =
    completionItem.data && typeof completionItem.data === 'object'
      ? (completionItem.data as Record<string, unknown>)
      : {}

  return {
    ...completionItem,
    textEdit: {
      range: ctx.range,
      newText: completionItem.insertText ?? completionItem.label,
    },
    additionalTextEdits: textEdits ? importPackageTextEdit(packagePath, ctx) : undefined,
    data: {
      ...existingData,
      packagePath,
    },
  }
}

const pkgNameFromPath = (importPath: string) => {
  const slashPos = importPath.lastIndexOf('/')
  return slashPos === -1 ? importPath : importPath.slice(slashPos + 1)
}

/**
 * Attempts to find first import path that matches package name.
 */
export const findPackagePathFromContext = ({ imports }: SuggestionContext, pkgName: string): string | undefined => {
  if (!imports.allPaths) {
    return undefined
  }

  if (imports.allPaths.has(pkgName)) {
    return pkgName
  }

  for (const importPath of imports.allPaths.keys()) {
    // TODO: support named imports
    if (pkgName === pkgNameFromPath(importPath)) {
      return importPath
    }
  }
}

const goDocDomain = 'pkg.go.dev'
export const symbolHoverDoc = ({
  label,
  packageName,
  packagePath,
  signature,
  documentation,
}: SymbolIndexItem): MarkedString[] => {
  const doc: MarkedString[] = []

  if (signature) {
    doc.push({
      language: 'go',
      value: signature,
    })
  }

  if (documentation?.value) {
    doc.push(documentation.value)
  }

  const docLabel = packagePath === 'builtin' ? label : `${packageName}.${label}`
  const linkLabel = `\`${docLabel}\` on ${goDocDomain}`
  doc.push(`[${linkLabel}](https://${goDocDomain}/${packagePath}#${label})`)

  return doc
}
