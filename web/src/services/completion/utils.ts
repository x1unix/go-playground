import type * as monaco from 'monaco-editor'
import { ImportClauseType, type Packages, type SuggestionContext, type Symbols, SymbolSourceKey } from './types'
import type { PackageIndexItem, SymbolIndexItem } from '../storage/types'

type CompletionItem = monaco.languages.CompletionItem

const getPrefix = (str: string) => str[0]?.toLowerCase() ?? ''

// Although monaco doesn't require actual range, it's defined as required in TS types.
// This is a stub value to satisfy type checks.
const stubRange = undefined as any as monaco.IRange

const packageCompletionKind = 8

const discardIfEmpty = (str: string, defaults?: string | undefined) => (str.length ? str : defaults)

const stringToMarkdown = (value: string): monaco.IMarkdownString | undefined => {
  if (!value.length) {
    return undefined
  }

  return {
    value,
    isTrusted: true,
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
    insertTextRules: insertTextRules[i],
    prefix: getPrefix(name),
    packageName: packages[i][SymbolSourceKey.Name],
    packagePath: packages[i][SymbolSourceKey.Path],
    documentation: stringToMarkdown(docs[i]),
  }))

export const importCompletionFromPackage = ({ importPath, name, documentation }: PackageIndexItem): CompletionItem => ({
  label: importPath,
  documentation,
  detail: name,
  insertText: importPath,
  kind: packageCompletionKind,
  range: stubRange,
})

type ISingleEditOperation = monaco.editor.ISingleEditOperation

const importPackageTextEdit = (
  importPath: string,
  { imports }: SuggestionContext,
): ISingleEditOperation[] | undefined => {
  if (!imports.range || imports.allPaths?.has(importPath)) {
    return undefined
  }

  switch (imports.blockType) {
    case ImportClauseType.None: {
      const text = `import "${importPath}"\n`
      return [
        {
          text: imports.prependNewLine ? `\n${text}` : text,
          range: imports.range,
          forceMoveMarkers: true,
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
          text: `import (\n${importLines}\n)`,
          range: imports.range,
          forceMoveMarkers: true,
        },
      ]
    }
  }
}

export const completionFromPackage = (
  { importPath, name, documentation }: PackageIndexItem,
  ctx: SuggestionContext,
): CompletionItem => ({
  label: name,
  documentation,
  detail: importPath,
  insertText: name,
  kind: packageCompletionKind,
  range: ctx.range,
  additionalTextEdits: importPackageTextEdit(importPath, ctx),
})

export const completionFromSymbol = (
  { packagePath, ...completionItem }: SymbolIndexItem,
  ctx: SuggestionContext,
  textEdits: boolean,
): CompletionItem => ({
  ...completionItem,
  range: ctx.range,
  additionalTextEdits: textEdits ? importPackageTextEdit(packagePath, ctx) : undefined,
})

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
}: SymbolIndexItem): monaco.IMarkdownString[] => {
  const doc: monaco.IMarkdownString[] = []

  if (signature) {
    doc.push({
      value: '```go\n' + signature + '\n```',
    })
  }

  if (documentation) {
    doc.push(documentation)
  }

  const docLabel = packagePath === 'builtin' ? label : `${packageName}.${label}`
  const linkLabel = `\`${docLabel}\` on ${goDocDomain}`
  doc.push({
    value: `[${linkLabel}](https://${goDocDomain}/${packagePath}#${label})`,
    isTrusted: true,
  })

  return doc
}
