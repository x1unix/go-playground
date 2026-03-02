import { type Diagnostic, linter } from '@codemirror/lint'
import type { DocumentState } from '../types'
import { docStateFromEditor } from '../utils'

type Thunk<T> = () => T

export interface LinterConfig {
  /**
   * Debounce interval to call a linter.
   */
  delay?: number

  /**
   * Function to handle lint requests.
   */
  handler: (doc: DocumentState) => readonly Diagnostic[] | Promise<readonly Diagnostic[]>
}

const DEFAULT_LINT_INTERVAL = 300
const EMPTY_DIAGS = []

/**
 * Returns extension based on CM linter that renders format errors from document state.
 */
export const newFormatErrorsRenderer = (src: Thunk<LinterConfig | undefined>) => {
  const lintCfg = {
    delay: src()?.delay ?? DEFAULT_LINT_INTERVAL,
  }

  return linter((view) => {
    // TODO: skip execution if doc isn't changed.
    const doc = docStateFromEditor(view.state)
    if (doc) {
      return src()?.handler(doc) ?? EMPTY_DIAGS
    }

    return EMPTY_DIAGS
  }, lintCfg)
}
