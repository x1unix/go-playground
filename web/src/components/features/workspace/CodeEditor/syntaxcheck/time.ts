import * as monaco from 'monaco-editor'
import environment from '~/environment'

const segmentLength = 'time.Now()'.length
const issueUrl = monaco.Uri.parse(`${environment.urls.github}/issues/104`)
const timeNowUsageWarning =
  'Warning: `time.Now()` will always return fake time. ' +
  'Change current environment to WebAssembly to use real date and time.'

/**
 * Checks if passed source code contains `time.Now()` calls and returns
 * a list of warning markers for those calls.
 *
 * Returns empty array if no calls found.
 */
export const getTimeNowUsageMarkers = (model: monaco.editor.ITextModel): monaco.editor.IMarkerData[] => {
  const code = model.getValue()
  const regex = /\W(time\.Now\(\))/gm
  const matches: number[] = []
  let match: RegExpExecArray | null
  while ((match = regex.exec(code))) {
    matches.push(match.index)
  }

  if (matches.length === 0) {
    return []
  }

  return matches.map((index) => {
    // Skip extra character or white-space before expression
    const { lineNumber, column } = model.getPositionAt(index + 1)
    return {
      code: {
        value: 'More information',
        target: issueUrl,
      },
      modelVersionId: model.getVersionId(),
      severity: monaco.MarkerSeverity.Warning,
      message: timeNowUsageWarning,
      startLineNumber: lineNumber,
      endLineNumber: lineNumber,
      startColumn: column,
      endColumn: column + segmentLength,
    }
  })
}
