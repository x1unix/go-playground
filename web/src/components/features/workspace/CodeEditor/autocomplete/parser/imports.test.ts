import * as monaco from 'monaco-editor'
import path from 'path'
import { assert, describe, test } from 'vitest'
import { importContextFromTokens } from './imports'
import { ImportClauseType, type ImportsContext } from '~/workers/language/types'

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
  sourceFile: string
  want: ImportsContext
}

const runContextTest = async ({ sourceFile, want }: TestCase) => {
  const input = await getFixture(sourceFile)
  const model = monaco.editor.createModel(input, 'go', monaco.Uri.file(sourceFile))
  const tokens = monaco.editor.tokenize(model.getValue(), model.getLanguageId())

  const ctx = importContextFromTokens(model, tokens)
  model.dispose()

  assert.deepEqual(ctx, want)
}

describe('buildImportContest', () => {
  monaco.languages.register({ id: 'go' })
  monaco.languages.setMonarchTokensProvider('go', language)

  test('should generate correct ranges', async () => {
    await runContextTest({
      sourceFile: 'hello.txt',
      want: {
        hasError: false,
        allPaths: new Set(['fmt']),
        blockPaths: ['fmt'],
        blockType: ImportClauseType.Block,
        range: {
          startLineNumber: 3,
          startColumn: 1,
          endLineNumber: 5,
          endColumn: 2,
        },
        totalRange: {
          startLineNumber: 1,
          endLineNumber: 5,
        },
      },
    })
  })

  test('should support inline import', async () => {
    await runContextTest({
      sourceFile: 'single.txt',
      want: {
        hasError: false,
        allPaths: new Set(['fmt']),
        blockPaths: ['fmt'],
        blockType: ImportClauseType.Single,
        range: {
          startLineNumber: 3,
          startColumn: 1,
          endLineNumber: 3,
          endColumn: 13,
        },
        totalRange: {
          startLineNumber: 1,
          endLineNumber: 3,
        },
      },
    })
  })

  test('should parse single group', async () => {
    await runContextTest({
      sourceFile: 'grouped.txt',
      want: {
        hasError: false,
        allPaths: new Set(['fmt', 'bar']),
        blockPaths: ['fmt', 'bar'],
        blockType: ImportClauseType.Block,
        range: {
          startLineNumber: 3,
          startColumn: 1,
          endLineNumber: 6,
          endColumn: 2,
        },
        totalRange: {
          startLineNumber: 1,
          endLineNumber: 6,
        },
      },
    })
  })

  test('should support multiple import blocks', async () => {
    await runContextTest({
      sourceFile: 'multiple.txt',
      want: {
        hasError: false,
        allPaths: new Set(['fmt', 'bar', 'baz']),
        blockPaths: ['baz'],
        blockType: ImportClauseType.Single,
        range: {
          startLineNumber: 8,
          startColumn: 1,
          endLineNumber: 8,
          endColumn: 19,
        },
        totalRange: {
          startLineNumber: 1,
          endLineNumber: 8,
        },
      },
    })
  })

  test('should be able to handle partial files', async () => {
    await runContextTest({
      sourceFile: 'corrupted.txt',
      want: {
        hasError: true,
        allPaths: new Set(['fmt']),
        blockPaths: ['fmt'],
        blockType: ImportClauseType.Single,
        range: {
          startLineNumber: 3,
          endLineNumber: 3,
          startColumn: 1,
          endColumn: 13,
        },
        totalRange: {
          startLineNumber: 1,
          endLineNumber: 3,
        },
      },
    })
  })
})
