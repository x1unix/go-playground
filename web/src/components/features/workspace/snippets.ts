import * as monaco from 'monaco-editor'

/* eslint-disable no-template-curly-in-string */

const Rule = monaco.languages.CompletionItemInsertTextRule
/**
 * List of snippets for editor
 */
const snippets = [
  {
    label: 'iferr',
    insertText: ['if err != nil {', '\treturn ${1:nil, err}', '}'].join('\n'),
    documentation: 'Return error if err != nil',
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
    documentation: 'Insert switch statement',
  },
  {
    label: 'go',
    insertText: ['go func(){', '\t$0', '}()'].join('\n'),
    documentation: 'Call goroutine',
  },
  {
    label: 'append',
    insertText: '$1 = append($1, $0)',
    documentation: 'Append to slice',
  },
  {
    label: 'typestruct',
    insertText: ['type ${1:name} struct {', '\t$0', '}'].join('\n'),
    documentation: 'Declare a struct',
  },
  {
    label: 'typeinterface',
    insertText: ['type ${1:name} interface {', '\t$0', '}'].join('\n'),
    documentation: 'Declare a struct',
  },
  {
    label: 'fmtprintf',
    insertText: 'fmt.Printf("${1:format}", $0)',
    documentation: 'fmt.Printf() shorthand',
  },
  {
    label: 'fmtprintln',
    insertText: 'fmt.Println(${0:message})',
    documentation: 'fmt.Println() shorthand',
  },
  {
    label: 'returnnil',
    insertText: 'return nil',
    documentation: 'return nil',
  },
  {
    label: 'timenow',
    insertText: '${0:t} := time.Now()',
    documentation: 'time.Now() shorthand',
  },
  {
    label: 'makeslice',
    insertText: '${0:items} := make([]${1:string}, ${2:0}, ${3:0})',
    documentation: 'Make a new slice',
  },
  {
    label: 'slice',
    insertText: '${1:items} := []${2:string}{${0}}',
    documentation: 'Declare slice',
  },
  {
    label: 'map',
    insertText: 'map[${1:string}]${0:value}',
    documentation: 'Insert map type',
  },
  {
    label: 'func',
    insertText: ['func ${1:functionName}(${3:param}) $4 {', '  $0', '}'].join('\n'),
    documentation: 'Insert a function',
  },
  {
    label: 'for',
    insertText: ['for _, ${1:v} := range ${2:value} {', '  $0', '}'].join('\n'),
    documentation: 'Insert a for range statement',
  },
].map((s) => ({
  kind: monaco.languages.CompletionItemKind.Snippet,
  insertTextRules: Rule.InsertAsSnippet,
  ...s,
}))

export default snippets as monaco.languages.CompletionItem[]
