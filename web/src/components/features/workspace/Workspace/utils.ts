import { goModTemplate } from '~/services/examples'

const splitPath = (fileName: string) => {
  const parts = fileName.split('/')
  const baseName = parts.pop()!

  return [baseName, parts.pop()]
}

const fileExtension = (fileName: string) => {
  const parts = fileName.split('.')
  return parts.pop()
}

export const newEmptyFileContent = (fileName: string) => {
  const [baseName, dirName] = splitPath(fileName)
  const fileExt = fileExtension(baseName!)

  if (fileExt === 'mod') {
    return goModTemplate
  }

  const pkg = dirName ?? 'main'
  return `package ${pkg}\n\n`
}
