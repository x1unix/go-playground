import type * as monaco from 'monaco-editor'
import { ImportClauseType, type PackageInfo, type SuggestionContext, type SymbolInfo } from './types'
import type { PackageIndexItem, SymbolIndexItem } from '../storage/types'

type CompletionItem = monaco.languages.CompletionItem

const getPrefix = (str: string) => str[0]?.toLowerCase() ?? ''

// Although monaco doesn't require actual range, it's defined as required in TS types.
// This is a stub value to satisfy type checks.
const stubRange = undefined as any as monaco.IRange

const packageCompletionKind = 8

export const intoPackageIndexItem = ({ name, importPath, documentation }: PackageInfo): PackageIndexItem => ({
  importPath,
  name,
  prefix: getPrefix(name),
  documentation: {
    value: documentation,
    isTrusted: true,
  },
})

export const intoSymbolIndexItem = ({
  name,
  package: pkg,
  documentation,
  ...completion
}: SymbolInfo): SymbolIndexItem => ({
  ...completion,
  key: `${pkg.path}.${name}`,
  prefix: getPrefix(name),
  label: name,
  packageName: pkg.name,
  packagePath: pkg.path,
  documentation: {
    value: documentation,
    isTrusted: true,
  },
})

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

  for (const importPath of imports.allPaths.keys()) {
    // TODO: support named imports
    if (pkgName === pkgNameFromPath(importPath)) {
      return importPath
    }
  }
}
