import { go } from '@codemirror/lang-go'
import { Compartment, type Extension } from '@codemirror/state'

import { goMod } from './modfile'

export enum Syntax {
  Go,
  GoMod,
}

export const defaultSyntax = Syntax.Go

const getFileExtension = (fName?: string) => {
  const extPos = fName?.lastIndexOf('.') ?? -1
  return extPos !== -1 && fName?.toLowerCase()?.slice(extPos)
}

/**
 * Detects language for syntax highlight by extension in a file name.
 */
export const syntaxFromFileName = (fName?: string): Syntax => {
  switch (getFileExtension(fName)) {
    case '.mod':
      return Syntax.GoMod

    case '.go':
    default:
      return Syntax.Go
  }
}

const getSyntaxExtension = (lang: Syntax): Extension => {
  switch (lang) {
    case Syntax.Go:
      return go()
    case Syntax.GoMod:
      return goMod()
  }
}

export const syntaxCompartment = new Compartment()

/**
 * Returns a new syntax extension compartment with initial syntax highlighter based on a file name.
 */
export const newSyntaxCompartment = (fileName?: string) =>
  syntaxCompartment.of(getSyntaxExtension(syntaxFromFileName(fileName)))

/**
 * Returns a new EditorState effect to replace syntax highlight extension.
 *
 * Use `syntaxFromFileName` to get language.
 */
export const updateSyntaxEffect = (lang: Syntax) => syntaxCompartment.reconfigure(getSyntaxExtension(lang))
