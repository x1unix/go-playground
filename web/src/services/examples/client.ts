import type { SnippetSource } from './types'

const baseUrl = new URL(import.meta.env.BASE_URL, location.origin)
const snippetsBaseDir = 'examples'

export const getSnippetFromSource = async (source: SnippetSource): Promise<Record<string, string>> => {
  const { basePath, files } = source
  const promises = files.map(async (file) => {
    const url = new URL(`${snippetsBaseDir}/${basePath}/${file}`, baseUrl)
    const rsp = await fetch(url)
    if (!rsp.ok) throw new Error(`HTTP Error: ${rsp.status} ${rsp.statusText}`)
    return [file, await rsp.text()] as const
  })

  const results = await Promise.all(promises)
  return Object.fromEntries(results)
}
