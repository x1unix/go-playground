export enum LanguageID {
  Go = 'go',
  GoMod = 'go.mod',
  GoSum = 'go.sum',
}

const basename = (filepath: string) => {
  const slashPos = filepath.lastIndexOf('/')
  return slashPos === -1 ? filepath : filepath.slice(slashPos + 1)
}

export const languageFromFilename = (filepath: string) => {
  const fname = basename(filepath)
  switch (fname) {
    case 'go.mod':
      return LanguageID.GoMod
    case 'go.sum':
      return LanguageID.GoSum
    default:
      return fname.endsWith('.go') ? LanguageID.Go : 'plaintext'
  }
}
