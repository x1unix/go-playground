import { CompletionItemKind, InsertTextFormat, type CompletionItem } from 'vscode-languageserver-protocol'

const snippetKind = CompletionItemKind.Snippet
const insertAsSnippet = InsertTextFormat.Snippet

type Snippet = CompletionItem

const snippets: Snippet[] = [
  {
    label: 'iferr',
    insertText: ['if err != nil {', '\treturn ${1:nil, err}', '}'].join('\n'),
    detail: 'Return error if err != nil',
    kind: snippetKind,
    insertTextFormat: insertAsSnippet,
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
    insertTextFormat: insertAsSnippet,
  },
  {
    label: 'go',
    insertText: ['go func(){', '\t$0', '}()'].join('\n'),
    detail: 'Call goroutine',
    kind: snippetKind,
    insertTextFormat: insertAsSnippet,
  },
  {
    label: 'typestruct',
    insertText: ['type ${1:name} struct {', '\t$0', '}'].join('\n'),
    detail: 'Declare a struct',
    kind: snippetKind,
    insertTextFormat: insertAsSnippet,
  },
  {
    label: 'typeinterface',
    insertText: ['type ${1:name} interface {', '\t$0', '}'].join('\n'),
    detail: 'Declare a struct',
    kind: snippetKind,
    insertTextFormat: insertAsSnippet,
  },
  {
    label: 'fmtprintf',
    insertText: 'fmt.Printf("${1:format}", $0)',
    detail: 'fmt.Printf() shorthand',
    kind: snippetKind,
    insertTextFormat: insertAsSnippet,
  },
  {
    label: 'fmtprintln',
    insertText: 'fmt.Println(${0:message})',
    detail: 'fmt.Println() shorthand',
    kind: snippetKind,
    insertTextFormat: insertAsSnippet,
  },
  {
    label: 'returnnil',
    insertText: 'return nil',
    detail: 'return nil',
    kind: snippetKind,
    insertTextFormat: insertAsSnippet,
  },
  {
    label: 'timenow',
    insertText: '${0:t} := time.Now()',
    detail: 'time.Now() shorthand',
    kind: snippetKind,
    insertTextFormat: insertAsSnippet,
  },
  {
    label: 'makeslice',
    insertText: '${0:items} := make([]${1:string}, ${2:0}, ${3:0})',
    detail: 'Make a new slice',
    kind: snippetKind,
    insertTextFormat: insertAsSnippet,
  },
  {
    label: 'slice',
    insertText: '${1:items} := []${2:string}{${0}}',
    detail: 'Declare slice',
    kind: snippetKind,
    insertTextFormat: insertAsSnippet,
  },
  {
    label: 'map',
    insertText: 'map[${1:string}]${0:value}',
    detail: 'Insert map type',
    kind: snippetKind,
    insertTextFormat: insertAsSnippet,
  },
  {
    label: 'func',
    insertText: ['func ${1:functionName}(${3:param}) $4 {', '  $0', '}'].join('\n'),
    detail: 'Insert a function',
    kind: snippetKind,
    insertTextFormat: insertAsSnippet,
  },
  {
    label: 'for',
    insertText: ['for _, ${1:v} := range ${2:value} {', '  $0', '}'].join('\n'),
    detail: 'Insert a for range statement',
    kind: snippetKind,
    insertTextFormat: insertAsSnippet,
  },
]

export default snippets
