import snippets from './snippets.json'

export enum SnippetType {
  Test = 'test',
  Experimental = 'experimental',
}

export interface Snippet {
  /**
   * label is snippet label
   */
  label: string

  /**
   * SnippetType is snippet type (if it's a test, etc)
   */
  type?: SnippetType

  /**
   * Custom icon for snippet. Overrides snippet type.
   */
  icon?: string

  /**
   * Snippet is snipped ID to be loaded
   *
   * Presents if snippet is referenced to snippet ID
   */
  snippet?: string

  /**
   * Text contains snipped code.
   *
   * Not empty when shipped field is empty
   */
  files?: Record<string, string>
}

export default snippets as Record<string, Snippet[]>
