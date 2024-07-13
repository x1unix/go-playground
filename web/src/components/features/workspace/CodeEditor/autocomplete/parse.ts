// Matches package (and method name)
const COMPL_REGEXP = /([a-zA-Z0-9_]+)(\.([A-Za-z0-9_]+))?$/
const R_GROUP_PKG = 1
const R_GROUP_METHOD = 3

export const parseExpression = (expr: string) => {
  COMPL_REGEXP.lastIndex = 0 // Reset regex state
  const m = COMPL_REGEXP.exec(expr)
  if (!m) {
    return null
  }

  const varName = m[R_GROUP_PKG]
  const propValue = m[R_GROUP_METHOD]

  if (!propValue) {
    return { value: varName }
  }

  return {
    packageName: varName,
    value: propValue,
  }
}
