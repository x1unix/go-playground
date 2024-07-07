interface StringChunk {
  isUrl: false
  content: string
}

interface URLChunk {
  isUrl: true
  content: string
}

type Chunk = StringChunk | URLChunk

/**
 * Finds all URLs in input string and splits it into text and URL segments.
 *
 * @param str input string
 */
export const splitStringUrls = (str: string) => {
  // pretty naive regex but works for most cases
  const re = /(((http|https):\/\/\S+)\w)/g

  const chunks: Chunk[] = []

  let offset = 0
  let m: RegExpExecArray | null = null
  while ((m = re.exec(str)) !== null) {
    if (m.index === re.lastIndex) {
      // Avoid infinite loop
      re.lastIndex++
    }

    if (m.index > offset) {
      chunks.push({
        isUrl: false,
        content: str.slice(offset, m.index),
      })
    }

    const [match] = m
    offset = m.index + match.length
    chunks.push({
      isUrl: true,
      content: match,
    })
  }

  // Trailing data
  if (str.length > offset) {
    chunks.push({
      isUrl: false,
      content: str.slice(offset),
    })
  }

  return chunks
}
