const queryRegexp = /(?<!["`])(^|\s|\(|\{|\*|&|\+|-|\/|\||=)([a-z0-9_]+)(\.([a-z0-9_]+)?)?$/i

export interface LiteralQuery {
  value: string
}

export interface PackageQuery {
  packageName: string
  value?: string
}

export type SymbolQuery = LiteralQuery | PackageQuery

export const parseExpression = (expr: string): SymbolQuery | null => {
  queryRegexp.lastIndex = 0
  const match = queryRegexp.exec(expr)
  if (!match) {
    return null
  }

  const [, , lhv, delim, rhv] = match
  if (rhv) {
    return {
      packageName: lhv,
      value: rhv,
    }
  }

  if (delim) {
    return {
      packageName: lhv,
    }
  }

  return {
    value: lhv,
  }
}
