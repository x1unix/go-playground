import { linter } from '@codemirror/lint'

/**
 * Returns extension based on CM linter that renders format errors from document state.
 */
export const newFormatErrorsRenderer = () =>
  linter((view) => {
    // TODO: render cached diagnostics
    return []
  })
