import snippets from './snippets.json'
import type { Snippets } from './types'

export * from './types.ts'
export * from './client.ts'
export * from './utils.ts'

export const getSnippetsList = () => snippets as Snippets
