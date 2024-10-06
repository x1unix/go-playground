import snippets from './snippets.json'
import type { Snippets } from './types'

export * from './types'
export * from './client'
export * from './utils'

export const getSnippetsList = () => snippets as Snippets
