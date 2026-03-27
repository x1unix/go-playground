import { parser } from '@lezer/go'
import type { SyntaxNode, Tree } from '@lezer/common'

import type { DocumentState } from '../types/common'

export interface HoverQuery {
  packageName?: string
  value: string
  from: number
  to: number
}

const identifierNodes = new Set(['VariableName', 'FieldName', 'TypeName', 'Bool', 'Nil', 'make', 'new'])

const isExported = (name: string) => name[0] === name[0]?.toUpperCase()

const isIdentifierNode = (node: SyntaxNode) => node.type.name === 'VariableName' || node.type.name === 'TypeName'

const rightMostIdentifier = (node: SyntaxNode | null): SyntaxNode | null => {
  if (!node) {
    return null
  }

  if (isIdentifierNode(node)) {
    return node
  }

  for (let child = node.lastChild; child; child = child.prevSibling) {
    const found = rightMostIdentifier(child)
    if (found) {
      return found
    }
  }

  return null
}

const getNodeAtOffset = (source: string, offset: number, existingTree?: Tree | null) => {
  const tree = existingTree ?? parser.parse(source)

  const tryResolve = (pos: number, side: -1 | 1) => {
    if (pos < 0 || pos > source.length) {
      return null
    }

    const node = tree.resolveInner(pos, side)
    return identifierNodes.has(node.type.name) ? node : null
  }

  const candidates: Array<[number, -1 | 1]> = [
    [offset, 1],
    [offset, -1],
    [offset - 1, 1],
    [offset - 1, -1],
    [offset + 1, 1],
    [offset + 1, -1],
  ]

  for (const [pos, side] of candidates) {
    const node = tryResolve(pos, side)
    if (node) {
      return node
    }
  }

  return null
}

export const queryFromPosition = (doc: DocumentState, offset: number, tree?: Tree | null): HoverQuery | null => {
  const source = doc.text.toString()
  const node = getNodeAtOffset(source, offset, tree)
  if (!node) {
    return null
  }

  const value = source.slice(node.from, node.to)
  if (!value.length) {
    return null
  }

  if (node.parent) {
    const selectorParent = node.parent
    const isSelectorMember = node.type.name === 'FieldName' && selectorParent.type.name === 'SelectorExpr'
    const isQualifiedTypeMember = node.type.name === 'TypeName' && selectorParent.type.name === 'QualifiedType'
    if (isSelectorMember || isQualifiedTypeMember) {
      const packageNode = isSelectorMember
        ? rightMostIdentifier(selectorParent.getChild('.')?.prevSibling ?? null)
        : selectorParent.getChild('VariableName')
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
  }

  return {
    value,
    from: node.from,
    to: node.to,
  }
}
