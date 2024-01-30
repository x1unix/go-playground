import type { FileUpdatePayload } from '../actions'

const MAX_FILE_SIZE = 1024 * 1024 * 10 // 5MB
const MAX_DEDUP_ATTEMPTS = 255

export const readFile = async (file: File) =>
  await new Promise<FileUpdatePayload>((resolve, reject) => {
    if (file.size > MAX_FILE_SIZE) {
      reject(`File is too large. Max file size is ${MAX_FILE_SIZE}`)
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const data = e.target?.result as string
      resolve({ filename: file.name, content: data })
    }

    reader.onerror = (e) => {
      reject(`Failed to read file: ${e}`)
    }

    reader.readAsText(file, 'UTF-8')
  })

const splitExt = (filename: string): [string, string] => {
  const idx = filename.lastIndexOf('.')
  if (idx === -1) {
    return [filename, '']
  }

  return [filename.slice(0, idx), filename.slice(idx)]
}

/**
 * Returns unique file name for a file by checking if similar file already exists in collection.
 *
 * Returns null if value can't be guessed after MAX_DEDUP_ATTEMPTS.
 *
 * @param filename
 * @param files
 */
const dedupFileName = (filename: string, files: Set<string>): string | null => {
  if (!files.has(filename)) {
    return filename
  }

  const [basename, ext] = splitExt(filename)
  for (let i = 0; i < MAX_DEDUP_ATTEMPTS; i++) {
    const newName = `${basename} (${i + 1})${ext}`
    if (files.has(newName)) {
      continue
    }

    return newName
  }

  return null
}

/**
 * Deduplicates files by filename.
 *
 * Constructs generator which deduplicate files by filename.
 * @param files - List of files to deduplicate.
 * @param currentValues - Initial list of existing names.
 * @param onError - callback to call when deduplication fails.
 */
export function* dedupFiles(files: FileList, currentValues: Set<string>, onError?: () => void): Generator<File> {
  for (const f of files) {
    const uniqName = dedupFileName(f.name, currentValues)
    if (!uniqName) {
      console.warn('Cannot dedup filename:', f.name)
      onError?.()
      continue
    }

    currentValues.add(uniqName)
    if (uniqName === f.name) {
      yield f
      continue
    }

    const { type, lastModified } = f
    const newFile = new File([f], uniqName, { type, lastModified })
    yield newFile
  }
}
