import { go } from '@codemirror/lang-go'
import { highlightTree, type Highlighter } from '@lezer/highlight'
import markdownit from 'markdown-it'
import type { MarkedString, MarkupContent } from 'vscode-languageserver-protocol'
import type { DocContent } from '../types/autocomplete'

import { classNames } from './styles'

const MD_CODE_BLOCK = '```'

interface NormalizedContent {
  isMarkdown: boolean
  value: string
}

type MarkupEntry = MarkedString | MarkupContent

const normalizeMarkupEntry = (entry: MarkupEntry): NormalizedContent => {
  if (typeof entry === 'string') {
    return {
      isMarkdown: false,
      value: entry,
    }
  }

  if ('kind' in entry) {
    return normalizeMarkupContentValue(entry)
  }

  const lang = entry.language ?? ''
  const value = `${MD_CODE_BLOCK}${lang}\n${entry.value}\n${MD_CODE_BLOCK}`

  return {
    isMarkdown: true,
    value,
  }
}

const normalizeMarkupContentValue = (content: MarkupContent): NormalizedContent => {
  return {
    isMarkdown: content.kind === 'markdown',
    value: content.value,
  }
}

const normalizeMarkupContent = (content: DocContent): NormalizedContent => {
  if (Array.isArray(content)) {
    return content.reduce(
      (acc: NormalizedContent, item: MarkupEntry): NormalizedContent => {
        const normalizedItem = normalizeMarkupEntry(item)
        return {
          isMarkdown: acc.isMarkdown || normalizedItem.isMarkdown,
          value: acc.value ? acc.value + '\n\n' + normalizedItem.value : normalizedItem.value,
        }
      },
      { isMarkdown: true, value: '' },
    )
  }

  return normalizeMarkupEntry(content)
}

export class MarkupRenderer {
  private readonly langGo = go().language
  private readonly printer: markdownit
  constructor(private readonly highlighter?: Highlighter) {
    this.printer = markdownit({
      html: false,
      breaks: true,
      highlight: (str: string, lang: string, _attrs: string) => {
        return this.highlightSource(str, lang)
      },
    })
  }

  private highlightSource(src: string, lang: string) {
    if (lang !== 'go' || !this.highlighter) {
      return `<pre class="code">${src}</pre>`
    }

    const tree = this.langGo.parser.parse(src)

    let buff = ''
    let prevEnd = 0
    highlightTree(tree, this.highlighter, (from, to, classes) => {
      // Preserve untokenized spaces
      if (prevEnd > 0) {
        const spaces = src.slice(prevEnd, from)
        if (spaces.length > 0) {
          buff += `<span>${spaces}</span>`
        }
      }

      prevEnd = to
      buff += `<span class="${classes}">${src.slice(from, to)}</span>`
    })

    return `<div class="code-highlighted">${buff}</div>`
  }

  renderContents(dst: HTMLElement, contents: DocContent) {
    const { isMarkdown, value } = normalizeMarkupContent(contents)
    if (isMarkdown) {
      dst.innerHTML = this.printer.render(value)
      return
    }

    const pre = document.createElement('pre')
    pre.innerText = value
    pre.style.whiteSpace = 'pre-wrap'
    dst.appendChild(pre)
  }
}

export const renderCompletionDoc = (renderer: MarkupRenderer, doc?: DocContent) => {
  if (!doc) {
    return null
  }

  const node = document.createElement('div')
  node.classList.add(classNames.completionDoc)
  if (typeof doc === 'string') {
    node.innerText = doc
  } else {
    renderer.renderContents(node, doc)
  }

  return node
}
