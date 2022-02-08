import snippets from './snippets.json';

export enum SnippetType {
  Test = 'test'
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
  text?: string
}

export default snippets as { [sectionName: string]: Snippet[] }
