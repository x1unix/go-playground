import type { languages } from 'monaco-editor'

export const conf: languages.LanguageConfiguration = {
  comments: {
    lineComment: '//',
  },
  brackets: [['(', ')']],
  autoClosingPairs: [
    { open: '(', close: ')' },
    { open: '"', close: '"', notIn: ['string'] },
    { open: '`', close: '`', notIn: ['string'] },
  ],
  surroundingPairs: [
    { open: '(', close: ')' },
    { open: '"', close: '"' },
    { open: '`', close: '`' },
  ],
}

export const language: languages.IMonarchLanguage = {
  defaultToken: '',
  tokenPostfix: '.go.mod',

  keywords: ['module', 'require', 'replace', 'exclude', 'go', 'toolchain'],
  operators: ['=>'],

  tokenizer: {
    root: [
      // Comments
      [/\/\/.*$/, 'comment'],

      // Multi-Line Directive
      [
        /^(\w+)(\s*)(\()/,
        [
          { cases: { '@keywords': 'keyword', '@default': 'identifier' }, next: '@directiveArgs' },
          'white',
          'delimiter.parenthesis',
        ],
      ],

      // Single-Line Directive
      [
        /^(\w+)(\s*)(.*)$/,
        [{ cases: { '@keywords': 'keyword', '@default': 'identifier' } }, 'white', { token: '', next: '@arguments' }],
      ],

      // Invalid
      [/.*$/, 'invalid'],
    ],

    directiveArgs: [{ include: '@arguments' }, [/\)/, { token: 'delimiter.parenthesis', next: '@pop' }]],

    arguments: [
      // Comments
      [/\/\/.*$/, 'comment'],

      // Double Quoted String
      [/"([^"\\]|\\.)*$/, 'string.invalid'], // Non-terminated string
      [/"/, { token: 'string.quote', next: '@doubleString' }],

      // Raw Quoted String
      [/`/, { token: 'string.quote', next: '@rawString' }],

      // Operator
      [/=>/, 'operator'],

      // Semver Version
      [
        /v(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)(?:-[\da-zA-Z-]+(?:\.[\da-zA-Z-]+)*)?(?:\+[\da-zA-Z-]+(?:\.[\da-zA-Z-]+)*)?/,
        'number',
      ],

      // Unquoted String
      [/([^\s/]|\/(?!\/))+/, 'string'],

      // Whitespace
      [/\s+/, 'white'],

      // End of Line
      [/$/, '', '@pop'],
    ],

    doubleString: [
      // Escaped Characters
      { include: '@stringEscapedChar' },

      // Placeholders
      { include: '@stringPlaceholder' },

      // Regular String Content
      [/[^\\%"']+/, 'string'],

      // Escape at End of Line
      [/\\$/, 'string.escape'],

      // Closing Quote
      [/"/, { token: 'string.quote', next: '@pop' }],

      // Invalid Escape
      [/\\./, 'string.escape.invalid'],
    ],

    rawString: [
      // Placeholders
      { include: '@stringPlaceholder' },

      // Regular String Content
      [/[^%`]+/, 'string'],

      // Percent Sign Not Followed by Placeholder
      [/%%/, 'string'],
      [/%/, 'string'],

      // Closing Backtick
      [/`/, { token: 'string.quote', next: '@pop' }],
    ],

    stringEscapedChar: [
      [/\\([0-7]{3}|[abfnrtv\\"']|x[0-9A-Fa-f]{2}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/, 'string.escape'],
      [/\\./, 'invalid'],
    ],

    stringPlaceholder: [
      [/%(\[\d+])?([+#\-0\x20]{0,2}((\d+|\*)?(\.?(?:\d+|\*|\[\d+]\*?)?\[\d+]?)?))?[vT%tbcdoqxXUeEfFgGsp]/, 'variable'],
    ],
  },
}
