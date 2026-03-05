import type { TagStyle } from '@codemirror/language'
import type { EditorView } from '@codemirror/view'
import { tagHighlighter, type Highlighter } from '@lezer/highlight'

export const classNames = {
  completionDoc: 'cm-lsp-completion-doc',
  tooltip: 'cm-lsp-tooltip',
  lezerTagPrefix: 'cm-lsp-tag',
}

type StyleSpec = Parameters<typeof EditorView.theme>[0]

// Root tooltip style doc blocks
const rootBlocks = ['.code', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'ul']
const rootBlocksSelector = (mod = ''): string =>
  rootBlocks.map((sel) => `& .${classNames.tooltip} ${sel}${mod}`).join(', ')

export const coreStyles: StyleSpec = {
  '& .cm-tooltip': {
    'max-width': '65%',
  },
  [`& .${classNames.completionDoc} code`]: {
    'font-family': 'var(--cm-tooltip-code-font)',
  },
  [`& .${classNames.completionDoc} pre`]: {
    'white-space': 'pre-wrap',
    // 'font-size': '0.9em',
    padding: '0.5em 0',
    'font-family': 'var(--cm-tooltip-code-font)',
  },
  [rootBlocksSelector()]: {
    margin: '8px 0',
  },
  [rootBlocksSelector(':last-child')]: {
    'margin-bottom': '0',
  },

  // Split hover sections with a border
  [`& .${classNames.tooltip}`]: {
    padding: '0',
  },
  [`& .${classNames.tooltip} > *`]: {
    'border-top': '1px solid var(--cm-tooltip-border-color, #ccc)',
    margin: '0 !important',
    padding: '4px 8px',
  },
  [`& .${classNames.tooltip} > *:first-child`]: {
    'border-top': 'none',
  },

  [`& .${classNames.tooltip} a`]: {
    'text-decoration': 'none',
    color: 'var(--cm-tooltip-link-color, initial)',
  },
  [`& .${classNames.tooltip} a code`]: {
    padding: '1px 3px',
    'border-radius': '4px',
    background: 'var(--cm-tooltip-link-code-color, none)',
  },
  [`& .${classNames.tooltip} code`]: {
    'font-family': 'var(--cm-tooltip-code-font, inherit)',
  },
  [`& .${classNames.tooltip} pre`]: {
    'white-space': 'pre-wrap',
    // 'font-size': '0.9em',
    'font-family': 'var(--cm-tooltip-code-font, inherit)',
  },
}

export interface PluginStyleVariables {
  codeFont: string
  linkColor: string
  linkCodeColor: string
  borderColor: string
}

const newVariableStyles = (vars: PluginStyleVariables): StyleSpec => ({
  [`&`]: {
    '--cm-tooltip-code-font': vars.codeFont,
    '--cm-tooltip-border-color': vars.borderColor,
    '--cm-tooltip-link-color': vars.linkColor,
    '--cm-tooltip-link-code-color': vars.linkCodeColor,
  },
})

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

export interface PluginTheme {
  /**
   * CSS style definitions.
   */
  styleSpec: StyleSpec

  /**
   * Syntax highlighter instance.
   *
   * Empty when no highlight theme was supplied.
   */
  highlighter?: Highlighter
}

export interface SourceExtensionStyles {
  /**
   * Additional editor styles.
   */
  styles?: StyleSpec

  /**
   * Syntax highlight theme.
   *
   * Used to highlight code snippets in CodeLens and suggestion documentation.
   */
  highlightStyles?: TagStyle[]

  /**
   * Popup style variables
   */
  variables: PluginStyleVariables
}

/**
 * Creates plugin theme.
 */
export const createPluginTheme = (opts?: SourceExtensionStyles): PluginTheme => {
  if (!opts?.highlightStyles) {
    return {
      styleSpec: opts?.styles ? { ...coreStyles, ...opts.styles } : coreStyles,
    }
  }

  const varStyles = newVariableStyles(opts.variables)
  const { styleSpec: highlightStyles, tagClasses } = buildHighlightClasses(opts.highlightStyles)
  let styleSpec = { ...varStyles, ...coreStyles, ...highlightStyles }
  if (opts.styles) {
    styleSpec = { ...styleSpec, ...opts.styles }
  }

  return {
    styleSpec,
    highlighter: tagHighlighter(tagClasses),
  }
}
