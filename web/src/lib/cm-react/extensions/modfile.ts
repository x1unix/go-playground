import { LanguageSupport, StreamLanguage } from '@codemirror/language'

/**
 * Very simple go.mod language stream parser
 *
 * Inspired by https://github.com/golang/vscode-go/blob/690cf2e3ff37d77314bbe2835bcfde80cad086a9/extension/syntaxes/go.mod.tmGrammar.json
 */
const goModLanguage = () =>
  StreamLanguage.define({
    token(stream) {
      if (stream.eatSpace()) return null

      if (
        stream.match(
          /v(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)(?:-[\da-z-]+(?:\.[\da-z-]+)*)?(?:\+[\da-z-]+(?:\.[\da-z-]+)*)?/,
        )
      ) {
        return 'constant name'
      }

      if (stream.match(/\/\/.*/)) {
        return 'comment'
      }

      if (stream.match(/(=>)/)) {
        return 'operator'
      }

      if (stream.match(/^(go|module|replace|require)\s/)) {
        return 'keyword'
      }

      if (stream.match(/\(|\)/)) {
        return 'bracket paren'
      }

      if (stream.match(/([^\s]|(?!))+/)) {
        return 'string'
      }

      stream.next()
      return null
    },
  })

export const goMod = () => new LanguageSupport(goModLanguage())
