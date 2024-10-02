import * as monaco from 'monaco-editor'
import path from 'path'
import { assert, test, describe } from 'vitest'
import { importContextFromTokens } from './parse'
import type { ImportsContext } from '~/services/completion'

// Core language packs aren't loaded in vitest.
// Autoloading via import also doesn't work.
import { language } from 'monaco-editor/esm/vs/basic-languages/go/go'

// eslint-disable-next-line -- vite can't resolve node ESM imports and TS can't resolve CJS types.
const fs = require('fs/promises') as typeof import('fs/promises')

const baseDir = path.dirname(new URL(import.meta.url).pathname)
const getFixture = async (filename: string) => {
  const fpath = path.join(baseDir, 'testdata', filename)
  return await fs.readFile(fpath, { encoding: 'utf-8' })
}

interface TestCase {
  label: string
  sourceFile: string
  want: ImportsContext
}

const cases: TestCase[] = [
  {
    label: 'should parse group imports',
    sourceFile: 'grouped.txt',
    want: {
      hasError: false,
      allPaths: new Set(['fmt']),
      blockPaths: ['fmt'],
      blockType: 2,
      range: {
        startLineNumber: 2,
        startColumn: 1,
        endLineNumber: 5,
        endColumn: 2,
      },
      totalRange: {
        startLineNumber: 1,
        endLineNumber: 5,
      },
    },
  },
]

describe.each(cases)('buildImportContext', ({ label, sourceFile, want }) => {
  monaco.languages.register({ id: 'go' })
  monaco.languages.setMonarchTokensProvider('go', language)

  test(label, async () => {
    const input = await getFixture(sourceFile)
    const model = monaco.editor.createModel(input, 'go', monaco.Uri.file('/file.go'))
    const tokens = monaco.editor.tokenize(model.getValue(), model.getLanguageId())

    const ctx = importContextFromTokens(model, tokens)
    assert.deepEqual(want, ctx)
  })
})
