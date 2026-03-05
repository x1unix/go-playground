import { parser } from '@lezer/go'

import type { DocumentState } from '../types/common'

export interface HoverQuery {
  packageName?: string
  value: string
  from: number
  to: number
}

const identifierNodes = new Set(['VariableName', 'FieldName', 'TypeName', 'Bool', 'Nil'])

const isExported = (name: string) => name[0] === name[0]?.toUpperCase()

const getNodeAtOffset = (source: string, offset: number) => {
  const tree = parser.parse(source)
  const node = tree.resolveInner(offset, -1)
  if (identifierNodes.has(node.type.name)) {
    return node
  }

  if (offset > 0) {
    const prevNode = tree.resolveInner(offset - 1, -1)
    if (identifierNodes.has(prevNode.type.name)) {
      return prevNode
    }
  }

  return null
}

export const queryFromPosition = (doc: DocumentState, offset: number): HoverQuery | null => {
  const source = doc.text.toString()
  const node = getNodeAtOffset(source, offset)
  if (!node) {
    return null
  }

  const value = source.slice(node.from, node.to)
  if (!value.length) {
    return null
  }

  if (node.type.name === 'FieldName' && node.parent?.type.name === 'SelectorExpr') {
    const selector = node.parent
    const packageNode = selector.getChild('VariableName')
    if (!packageNode) {
      return null
    }

    if (!isExported(value)) {
      return null
    }

    return {
      packageName: source.slice(packageNode.from, packageNode.to),
      value,
      from: packageNode.from,
      to: node.to,
    }
  }

  return {
    value,
    from: node.from,
    to: node.to,
  }
}
