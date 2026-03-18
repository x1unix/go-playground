import { Text } from '@codemirror/state'
import { assert, describe, test } from 'vitest'

import { Syntax, type DocumentState } from '../types/common'
import { DocumentMetadataCache } from './cache'

const newDocument = (content: string): DocumentState => ({
  path: 'main.go',
  language: Syntax.Go,
  text: Text.of(content.split('\n')),
})

describe('DocumentMetadataCache.resolveImportAlias', () => {
  test('returns destination import path for a named alias', () => {
    const cache = new DocumentMetadataCache()
    const doc = newDocument(['package main', 'import (', '\tb64 "encoding/base64"', ')', ''].join('\n'))

    assert.equal(cache.resolveImportAlias(doc, 'b64'), 'encoding/base64')
  })

  test('returns source value when alias does not exist', () => {
    const cache = new DocumentMetadataCache()
    const doc = newDocument(['package main', 'import "fmt"', ''].join('\n'))

    assert.equal(cache.resolveImportAlias(doc, 'fmt'), 'fmt')
    assert.equal(cache.resolveImportAlias(doc, 'doesNotExist'), 'doesNotExist')
  })

  test('invalidates alias mapping when import area changes', () => {
    const cache = new DocumentMetadataCache()

    const docV1 = newDocument(['package main', 'import (', '\tb64 "encoding/base64"', ')', ''].join('\n'))

    assert.equal(cache.resolveImportAlias(docV1, 'b64'), 'encoding/base64')

    cache.handleUpdate({
      path: docV1.path,
      changes: [
        {
          startLineNumber: 3,
          endLineNumber: 3,
        },
      ],
    })

    const docV2 = newDocument(['package main', 'import (', '\tbase64enc "encoding/base64"', ')', ''].join('\n'))

    assert.equal(cache.resolveImportAlias(docV2, 'b64'), 'b64')
    assert.equal(cache.resolveImportAlias(docV2, 'base64enc'), 'encoding/base64')
  })
})
