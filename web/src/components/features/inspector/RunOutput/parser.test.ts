import { expect, test, describe } from 'vitest'
import { splitStringUrls } from './parser'

const cases = [
  {
    label: 'no URLs',
    input: `prog.go:8:28: illegal character U+003F '?' (and 1 more errors)`,
    want: [
      {
        isUrl: false,
        content: `prog.go:8:28: illegal character U+003F '?' (and 1 more errors)`,
      },
    ],
  },
  {
    label: 'single URL at end',
    input:
      "Due to Go Playground bug, unit test snippets can't have multiple files. " +
      'Please remove non-test Go files. See: https://github.com/golang/go/issues/68327',
    want: [
      {
        isUrl: false,
        content:
          "Due to Go Playground bug, unit test snippets can't have multiple files. " +
          'Please remove non-test Go files. See: ',
      },
      {
        isUrl: true,
        content: 'https://github.com/golang/go/issues/68327',
      },
    ],
  },
  {
    label: 'URL at the middle of string',
    input: 'This func is deprecated, see: https://github.com/foo/bar. Also some other string',
    want: [
      {
        isUrl: false,
        content: 'This func is deprecated, see: ',
      },
      {
        isUrl: true,
        content: 'https://github.com/foo/bar',
      },
      {
        isUrl: false,
        content: '. Also some other string',
      },
    ],
  },
  {
    label: 'URL at start of a string',
    input: 'https://google.com - no such hostname',
    want: [
      {
        isUrl: true,
        content: 'https://google.com',
      },
      {
        isUrl: false,
        content: ' - no such hostname',
      },
    ],
  },
  {
    label: 'complex string',
    input:
      'go: finding module for package localhost.localdomain/foo/bar\n' +
      'prog.go:6:2: cannot find module providing package localhost.localdomain/foo/bar: ' +
      'module localhost.localdomain/foo/bar: reading https://proxy.golang.org/localhost.localdomain/foo/bar/@v/list: 404 Not Found\n' +
      '\tserver response: not found: localhost.localdomain/foo/bar@latest: unrecognized import path ' +
      '"localhost.localdomain/foo/bar": https fetch: Get "https://localhost.localdomain/foo/bar?go-get=1": dial tcp: ' +
      'lookup localhost.localdomain on 8.8.8.8:53: no such host',
    want: [
      {
        isUrl: false,
        content:
          'go: finding module for package localhost.localdomain/foo/bar\n' +
          'prog.go:6:2: cannot find module providing package localhost.localdomain/foo/bar: ' +
          'module localhost.localdomain/foo/bar: reading ',
      },
      {
        isUrl: true,
        content: 'https://proxy.golang.org/localhost.localdomain/foo/bar/@v/list',
      },
      {
        isUrl: false,
        content:
          ': 404 Not Found\n' +
          '\tserver response: not found: localhost.localdomain/foo/bar@latest: unrecognized import path ' +
          '"localhost.localdomain/foo/bar": https fetch: Get "',
      },
      {
        isUrl: true,
        content: 'https://localhost.localdomain/foo/bar?go-get=1',
      },
      {
        isUrl: false,
        content: '": dial tcp: lookup localhost.localdomain on 8.8.8.8:53: no such host',
      },
    ],
  },
]

describe.each(cases)('extractStringUrls parses string', ({ label, input, want }) => {
  test(`input with ${label}`, () => {
    const result = splitStringUrls(input)
    expect(result).toEqual(want)
  })
})
