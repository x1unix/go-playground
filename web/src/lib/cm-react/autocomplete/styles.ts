import type { TagStyle } from '@codemirror/language'
import type { EditorView } from '@codemirror/view'
import { tagHighlighter, type Highlighter } from '@lezer/highlight'

export const classNames = {
  completionDoc: 'cm-lsp-completion-doc',
  tooltip: 'cm-lsp-tooltip',
  lezerTagPrefix: 'cm-lsp-tag',
}

type StyleSpec = Parameters<typeof EditorView.theme>[0]

export interface PluginTheme {
  /**
   * Generated CSS class rules for the syntax highlighter tags.
   *
   * Contains only highlight-specific styles (not layout or color variables).
   * Injected via EditorView.theme() so CodeMirror can scope them to the editor.
   */
  styleSpec?: StyleSpec

  /**
   * Syntax highlighter instance for code blocks in documentation.
   *
   * Empty when no highlight theme was supplied.
   */
  highlighter?: Highlighter
}

// Infer type as it isn't exported.
type Mutable<T> = {
  -readonly [P in keyof T]: T[P]
}

type TagClasses = Mutable<Parameters<typeof tagHighlighter>[0]>

/**
 * Constructs CSS stylesheet and highlight theme for syntax highlighter.
 */
const buildHighlightClasses = (tagStyles: TagStyle[]) => {
  const styleSpec: StyleSpec = {}
  const tagClasses: TagClasses = []

  for (let i = 0; i < tagStyles.length; i++) {
    const { tag, class: className, ...styles } = tagStyles[i]
    const hasStyles = Object.keys(styles).length
    if (!hasStyles) {
      if (className) {
        tagClasses.push({
          tag,
          class: className,
        })
      }
      continue
    }

    const styleClassName = className ?? `${classNames.lezerTagPrefix}_${i}`
    styleSpec[`& .${styleClassName}`] = styles
    tagClasses.push({
      tag,
      class: styleClassName,
    })
  }

  return { styleSpec, tagClasses }
}

/**
 * Creates a plugin theme from a list of tag styles.
 *
 * Generates CSS classes for syntax highlighting in documentation code blocks.
 */
export const createPluginTheme = (tagStyles: TagStyle[]): PluginTheme => {
  const { styleSpec, tagClasses } = buildHighlightClasses(tagStyles)
  return {
    styleSpec: Object.keys(styleSpec).length ? styleSpec : undefined,
    highlighter: tagHighlighter(tagClasses),
  }
}
