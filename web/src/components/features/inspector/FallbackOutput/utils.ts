const imageSectionPrefix = 'IMAGE:'
const base64RegEx = /[A-Za-z0-9+/]+={0,2}$/
const imageRegEx = /(IMAGE:[A-Za-z0-9+/]+={0,2})/

export const isImageLine = (message: string): [boolean, string] => {
  if (!message.startsWith(imageSectionPrefix)) {
    return [false, message]
  }

  const payload = message.substring(imageSectionPrefix.length).trim()
  return [base64RegEx.test(payload), payload]
}

interface TextChunk {
  isImage?: boolean
  data: string
}

/**
 * Finds all embedded base64 image segments and tokenizes content.
 *
 * Used to support embedded images in Go program stdout like go.dev/play does.
 */
export const splitImageAndText = (data: string): TextChunk[] =>
  data.split(imageRegEx).map((str) => {
    const [isImage, data] = isImageLine(str)
    return { isImage, data }
  })
