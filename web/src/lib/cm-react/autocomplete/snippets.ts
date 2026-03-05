import type * as monaco from 'monaco-editor'

const snippetKind = 27
const insertAsSnippet = 4

type Snippet = monaco.languages.CompletionItem

const snippets: Snippet[] = [
  {
    label: 'iferr',
    insertText: ['if err != nil {', '\treturn ${1:nil, err}', '}'].join('\n'),
    detail: 'Return error if err != nil',
    kind: snippetKind,
    insertTextRules: insertAsSnippet,
    range: undefined as any,
  },
  {
    label: 'switch',
    insertText: [
      'switch ${1:expression} {',
      '\tcase ${2:match}:',
      '\t\t$0',
      '\tdefault:',
      '\t\t// TODO: implement',
      '}',
    ].join('\n'),
    detail: 'Insert switch statement',
    kind: snippetKind,
    insertTextRules: insertAsSnippet,
    range: undefined as any,
  },
  {
    label: 'go',
    insertText: ['go func(){', '\t$0', '}()'].join('\n'),
    detail: 'Call goroutine',
    kind: snippetKind,
    insertTextRules: insertAsSnippet,
    range: undefined as any,
  },
  {
    label: 'typestruct',
    insertText: ['type ${1:name} struct {', '\t$0', '}'].join('\n'),
    detail: 'Declare a struct',
    kind: snippetKind,
    insertTextRules: insertAsSnippet,
    range: undefined as any,
  },
  {
    label: 'typeinterface',
    insertText: ['type ${1:name} interface {', '\t$0', '}'].join('\n'),
    detail: 'Declare a struct',
    kind: snippetKind,
    insertTextRules: insertAsSnippet,
    range: undefined as any,
  },
  {
    label: 'fmtprintf',
    insertText: 'fmt.Printf("${1:format}", $0)',
    detail: 'fmt.Printf() shorthand',
    kind: snippetKind,
    insertTextRules: insertAsSnippet,
    range: undefined as any,
  },
  {
    label: 'fmtprintln',
    insertText: 'fmt.Println(${0:message})',
    detail: 'fmt.Println() shorthand',
    kind: snippetKind,
    insertTextRules: insertAsSnippet,
    range: undefined as any,
  },
  {
    label: 'returnnil',
    insertText: 'return nil',
    detail: 'return nil',
    kind: snippetKind,
    insertTextRules: insertAsSnippet,
    range: undefined as any,
  },
  {
    label: 'timenow',
    insertText: '${0:t} := time.Now()',
    detail: 'time.Now() shorthand',
    kind: snippetKind,
    insertTextRules: insertAsSnippet,
    range: undefined as any,
  },
  {
    label: 'makeslice',
    insertText: '${0:items} := make([]${1:string}, ${2:0}, ${3:0})',
    detail: 'Make a new slice',
    kind: snippetKind,
    insertTextRules: insertAsSnippet,
    range: undefined as any,
  },
  {
    label: 'slice',
    insertText: '${1:items} := []${2:string}{${0}}',
    detail: 'Declare slice',
    kind: snippetKind,
    insertTextRules: insertAsSnippet,
    range: undefined as any,
  },
  {
    label: 'map',
    insertText: 'map[${1:string}]${0:value}',
    detail: 'Insert map type',
    kind: snippetKind,
    insertTextRules: insertAsSnippet,
    range: undefined as any,
  },
  {
    label: 'func',
    insertText: ['func ${1:functionName}(${3:param}) $4 {', '  $0', '}'].join('\n'),
    detail: 'Insert a function',
    kind: snippetKind,
    insertTextRules: insertAsSnippet,
    range: undefined as any,
  },
  {
    label: 'for',
    insertText: ['for _, ${1:v} := range ${2:value} {', '  $0', '}'].join('\n'),
    detail: 'Insert a for range statement',
    kind: snippetKind,
    insertTextRules: insertAsSnippet,
    range: undefined as any,
  },
]

export default snippets
