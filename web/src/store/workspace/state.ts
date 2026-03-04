export const defaultFileName = 'main.go'
const defaultFile = `
package main

import (
\t"fmt"
)

func main() {
\tfmt.Println("Hello, World!")
}
`.trimStart()

export interface SnippetState {
  /**
   * Current snippet ID.
   */
  id?: string | null

  /**
   * Represents whether snippet is loading.
   */
  loading?: boolean

  /**
   * Contains snippet loading error.
   */
  error?: string | null
}

/**
 * Represents current workspace state.
 */
export interface WorkspaceState {
  /**
   * Generation is a cache key for CodeMirror editor state.
   *
   * Generation update triggers code editor cache and state flush.
   * Used eo flush cache after files format and snippet load operations.
   *
   * @see web/src/lib/cm-react/buffers/store.ts
   */
  generation: number

  /**
   * Represents current snippet state.
   *
   * Empty if snippet is not loaded.
   */
  snippet?: SnippetState | null

  /**
   * Current selected file name.
   */
  selectedFile?: string | null

  /**
   * Key-value pair of file names and their content.
   */
  files?: Record<string, string>

  /**
   * Indicates whether any of workspace files were changed.
   */
  dirty?: boolean
}

export const initialWorkspaceState: WorkspaceState = {
  generation: 0,
  snippet: {
    loading: true,
  },
}

export const defaultFiles = {
  [defaultFileName]: defaultFile,
}

/**
 * Returns a new workspace state generation key
 */
export const newGenerationKey = () => Date.now()

export const getDefaultWorkspaceState = (): WorkspaceState => ({
  generation: newGenerationKey(),
  selectedFile: defaultFileName,
  snippet: {
    loading: false,
  },
  files: {
    [defaultFileName]: defaultFile,
  },
})
