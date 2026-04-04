import path from 'path'
import { Text } from '@codemirror/state'
import { assert, describe, test } from 'vitest'

import { Syntax } from '../types/common'
import { ImportClauseType, type ImportsContext } from '~/workers/language/types'
import { buildImportContext } from './imports'

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
  const ctx = buildImportContext({
    path: sourceFile,
    language: Syntax.Go,
    text: Text.of(input.split('\n')),
  })

  assert.deepEqual(ctx, want)
}

describe('buildImportContext', () => {
  test('should generate correct ranges', async () => {
    await runContextTest({
      sourceFile: 'hello.txt',
      want: {
        hasError: false,
        allPaths: new Set(['fmt']),
        blockPaths: ['fmt'],
        blockType: ImportClauseType.Block,
        range: {
          start: {
            line: 2,
            character: 0,
          },
          end: {
            line: 4,
            character: 1,
          },
        },
        totalRange: {
          start: {
            line: 0,
            character: 0,
          },
          end: {
            line: 4,
            character: 0,
          },
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
          start: {
            line: 2,
            character: 0,
          },
          end: {
            line: 2,
            character: 12,
          },
        },
        totalRange: {
          start: {
            line: 0,
            character: 0,
          },
          end: {
            line: 2,
            character: 0,
          },
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
          start: {
            line: 2,
            character: 0,
          },
          end: {
            line: 5,
            character: 1,
          },
        },
        totalRange: {
          start: {
            line: 0,
            character: 0,
          },
          end: {
            line: 5,
            character: 0,
          },
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
        importAliases: new Map([['alias', 'baz']]),
        blockPaths: ['baz'],
        blockType: ImportClauseType.Single,
        range: {
          start: {
            line: 7,
            character: 0,
          },
          end: {
            line: 7,
            character: 18,
          },
        },
        totalRange: {
          start: {
            line: 0,
            character: 0,
          },
          end: {
            line: 7,
            character: 0,
          },
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
          start: {
            line: 2,
            character: 0,
          },
          end: {
            line: 2,
            character: 12,
          },
        },
        totalRange: {
          start: {
            line: 0,
            character: 0,
          },
          end: {
            line: 2,
            character: 0,
          },
        },
      },
    })
  })
})
