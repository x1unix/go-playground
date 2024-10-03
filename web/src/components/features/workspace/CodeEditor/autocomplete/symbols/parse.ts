// Matches package (and method name)
const queryRegexp = /(^|\s)([a-z0-9_]+)(\.([a-z0-9_]+)?)?$/i

export const parseExpression = (expr: string) => {
  queryRegexp.lastIndex = 0 // Reset regex state
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
