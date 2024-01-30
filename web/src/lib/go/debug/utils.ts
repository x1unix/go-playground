export const whitespaceChars = new Set(
  [
    '\n',
    '\t',
    '\r',
    '\f',
    '\v',
    '\u00a0',
    '\u1680',
    '\u2000',
    '\u200a',
    '\u2028',
    '\u2029',
    '\u202f',
    '\u205f',
    '\u3000',
    '\ufeff',
  ].map((s) => s.charCodeAt(0)),
)

export const pad = (str: string, count: number, isLeft = false, char = ' ') => {
  if (str.length >= count) {
    return str
  }

  const padding = char.repeat(count - str.length)
  return isLeft ? padding + str : str + padding
}

export const padRight = (str: string, count: number, char = ' ') => pad(str, count, false, char)

export const padLeft = (str: string, count: number, char = ' ') => pad(str, count, true, char)
