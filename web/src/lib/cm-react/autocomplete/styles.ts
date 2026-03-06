import type { TagStyle } from '@codemirror/language'
import type { EditorView } from '@codemirror/view'
import { tagHighlighter, type Highlighter } from '@lezer/highlight'
import { CompletionItemKind } from '../types/autocomplete'

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
  // Icons
  ['& .cm-completionIcon:after']: {
    'font-family': 'codicon',
    color: 'var(--cm-tooltip-symbol-default)',
  },
  ['& .cm-completionIcon.cm-completionIcon-method:after']: {
    content: "'\\ea8c'",
    color: 'var(--cm-tooltip-symbol-method, var(--cm-tooltip-symbol-default))',
  },
  ['& .cm-completionIcon.cm-completionIcon-function:after']: {
    content: "'\\ea8c'",
    color: 'var(--cm-tooltip-symbol-function, var(--cm-tooltip-symbol-default))',
  },
  ['& .cm-completionIcon.cm-completionIcon-field:after']: {
    content: "'\\eb5f'",
    color: 'var(--cm-tooltip-symbol-field, var(--cm-tooltip-symbol-default))',
  },
  ['& .cm-completionIcon.cm-completionIcon-variable:after']: {
    content: "'\\ea88'",
    color: 'var(--cm-tooltip-symbol-variable, var(--cm-tooltip-symbol-default))',
  },
  ['& .cm-completionIcon.cm-completionIcon-class:after']: {
    content: "'\\eb5b'",
    color: 'var(--cm-tooltip-symbol-class, var(--cm-tooltip-symbol-default))',
  },
  ['& .cm-completionIcon.cm-completionIcon-struct:after']: {
    content: "'\\ea91'",
    color: 'var(--cm-tooltip-symbol-struct, var(--cm-tooltip-symbol-default))',
  },
  ['& .cm-completionIcon.cm-completionIcon-interface:after']: {
    content: "'\\eb61'",
    color: 'var(--cm-tooltip-symbol-interface, var(--cm-tooltip-symbol-default))',
  },
  ['& .cm-completionIcon.cm-completionIcon-module:after']: {
    content: "'\\ea8b'",
    color: 'var(--cm-tooltip-symbol-module, var(--cm-tooltip-symbol-default))',
  },
  ['& .cm-completionIcon.cm-completionIcon-constant:after']: {
    content: "'\\eb5d'",
    color: 'var(--cm-tooltip-symbol-constant, var(--cm-tooltip-symbol-default))',
  },
  ['& .cm-completionIcon.cm-completionIcon-snippet:after']: {
    content: "'\\eb66'",
    color: 'var(--cm-tooltip-symbol-snippet, var(--cm-tooltip-symbol-default))',
  },
  ['& .cm-completionIcon.cm-completionIcon-property:after']: {
    content: "'\\eb65'",
    color: 'var(--cm-tooltip-symbol-property, var(--cm-tooltip-symbol-default))',
  },
  ['& .cm-completionIcon.cm-completionIcon-event:after']: {
    content: "'\\ea86'",
    color: 'var(--cm-tooltip-symbol-event, var(--cm-tooltip-symbol-default))',
  },
  ['& .cm-completionIcon.cm-completionIcon-operator:after']: {
    content: "'\\eb64'",
    color: 'var(--cm-tooltip-symbol-operator, var(--cm-tooltip-symbol-default))',
  },
  ['& .cm-completionIcon.cm-completionIcon-enum:after']: {
    content: "'\\ea95'",
    color: 'var(--cm-tooltip-symbol-enum, var(--cm-tooltip-symbol-default))',
  },
  ['& .cm-completionIcon.cm-completionIcon-enumMember:after']: {
    content: "'\\eb5e'",
    color: 'var(--cm-tooltip-symbol-enumMember, var(--cm-tooltip-symbol-default))',
  },
  ['& .cm-completionIcon.cm-completionIcon-keyword:after']: {
    content: "'\\eb62'",
    color: 'var(--cm-tooltip-symbol-keyword, var(--cm-tooltip-symbol-default))',
  },
  ['& .cm-completionIcon.cm-completionIcon-text:after']: {
    content: "'\\eb62'",
    'font-size': 'inherit',
    color: 'var(--cm-tooltip-symbol-text, var(--cm-tooltip-symbol-default))',
  },

  '& .cm-tooltip': {
    'max-width': '65%',
  },
  // Completion doc
  [`& .${classNames.completionDoc} code`]: {
    'font-family': 'var(--cm-tooltip-code-font)',
  },
  [`& .cm-tooltip.cm-completionInfo`]: {
    border: '1px solid var(--cm-hover-border-color)',
    background: 'var(--cm-comp-list-background)',
    padding: '0',
  },
  [`& .${classNames.completionDoc}`]: {
    // Reset styles
    'white-space': 'normal',
    'max-height': '300px',
    overflow: 'auto',
    padding: '4px 5px',
  },
  [`& .${classNames.completionDoc} p:first-child`]: {
    // Fix margin on first children
    'margin-top': '0',
  },
  [`& .${classNames.completionDoc} p:last-child`]: {
    // Fix margin on last children
    'margin-bottom': '0',
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
  [`& .${classNames.completionDoc} a`]: {
    'text-decoration': 'none',
    color: 'var(--cm-tooltip-link-color, initial)',
  },
  [`& .${classNames.completionDoc} a code`]: {
    padding: '1px 3px',
    'border-radius': '4px',
    background: 'var(--cm-tooltip-link-code-color, none)',
  },
  // List item decorations
  ['& .cm-tooltip-autocomplete.cm-tooltip']: {
    // Light: #c8c8c8
    // Dark: #454545
    border: '1px solid var(--cm-comp-list-border-color)',
    // Light: #f3f3f3
    // Dark: #252526
    background: 'var(--cm-comp-list-background)',
  },

  // Autocomplete item - Holder
  ['& .cm-tooltip-autocomplete.cm-tooltip > ul > li']: {
    display: 'flex',
    'text-overflow': 'ellipsis',
    'justify-content': 'space-between',
    'padding-right': '0.651em',
  },

  ['& .cm-tooltip-autocomplete.cm-tooltip > ul > li[aria-selected]']: {
    // Dark: #04395e
    // Light: #0060c0
    background: 'var(--cm-comp-item-bg-active)',
  },

  // Autocomplete item - Icon
  ['& .cm-tooltip-autocomplete.cm-tooltip .cm-completionIcon']: {
    display: 'flex',
    'align-items': 'center',
    'font-size': '1em',
  },

  // Autocomplete item - Left part
  ['& .cm-tooltip-autocomplete.cm-tooltip > ul > li > .cm-completionLabel']: {
    display: 'flex',
    overflow: 'hidden',
    'font-family': 'var(--cm-tooltip-code-font)',
    'flex-grow': '1',
    'flex-shrink': '1',
  },

  // Autocomplete item - Right part
  ['& .cm-tooltip-autocomplete.cm-tooltip > ul > li > .cm-completionDetail']: {
    display: 'flex',
    overflow: 'hidden',
    'font-family': 'var(--cm-tooltip-code-font)',
    'flex-shrink': '4',
    'max-width': '70%',
    'margin-left': '1.1em',
    'font-size': '0.85em',
    'font-style': 'normal',
    'align-items': 'center',
    opacity: '.7',
    visibility: 'hidden',
  },

  ['& .cm-tooltip-autocomplete.cm-tooltip > ul > li[aria-selected] > .cm-completionDetail']: {
    visibility: 'visible',
  },

  // ???
  [rootBlocksSelector()]: {
    margin: '8px 0',
  },
  [rootBlocksSelector(':last-child')]: {
    'margin-bottom': '0',
  },

  // Hover tooltip
  ['& .cm-tooltip.cm-tooltip-hover']: {
    borderRadius: 'var(--cm-hover-border-radius)',
    border: '1px solid var(--cm-hover-border-color)',
    background: 'var(--cm-comp-list-background)',
  },

  // Split hover sections with a border
  [`& .${classNames.tooltip}`]: {
    padding: '0',
  },
  [`& .${classNames.tooltip} > *`]: {
    'border-top': '1px solid var(--cm-hover-border-color, #ccc)',
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
  hoverBorderColor: string
  hoverBorderRadius: string
  completionListBorderColor: string
  completionListBackground: string
  completionActiveBackground: string
  symbolColors: Partial<Record<CompletionItemKind & 'default', string>>
}

const newVariableStyles = (vars: PluginStyleVariables): StyleSpec => {
  const symbolVars: Record<string, string> = {}

  if (vars.symbolColors) {
    ;(Object.entries(vars.symbolColors) as [CompletionItemKind, string][]).forEach(([kind, color]) => {
      if (color) {
        // Uses the key exactly as defined in the type
        symbolVars[`--cm-tooltip-symbol-${kind}`] = color
      }
    })
  }

  return {
    ['&']: {
      '--cm-tooltip-code-font': vars.codeFont,
      '--cm-hover-border-color': vars.hoverBorderColor,
      '--cm-hover-border-radius': vars.hoverBorderRadius,
      '--cm-tooltip-link-color': vars.linkColor,
      '--cm-tooltip-link-code-color': vars.linkCodeColor,
      '--cm-comp-list-border-color': vars.completionListBorderColor,
      '--cm-comp-list-background': vars.completionListBackground,
      '--cm-comp-item-bg-active': vars.completionActiveBackground,
      ...symbolVars,
    },
  }
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
