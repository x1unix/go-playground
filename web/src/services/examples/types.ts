interface SnippetBase {
  /**
   * label is snippet label
   */
  label: string

  /**
   * Custom icon for snippet.
   */
  icon?: string

  /**
   * Custom icon color for snippet.
   */
  iconColor?: string
}

export interface SnippetSource {
  /**
   * Base path for snippet resources.
   */
  basePath: string

  /**
   * List of files.
   */
  files: string[]
}

/**
 * Snippet shared on to Go Playground.
 */
type SharedSnippet = SnippetBase & {
  /**
   * Snippet is Go Playground snipped ID to be loaded
   *
   * Presents if snippet is referenced to snippet ID
   */
  id: string

  source?: never
}

/**
 * Snippet based on file URLs.
 */
type URLSnippet = SnippetBase & {
  source: SnippetSource
  snippetId?: never
}

export type Snippet = SharedSnippet | URLSnippet

export type Snippets = Record<string, Snippet[]>
