import * as monaco from 'monaco-editor'
import { newMarkerAction, type StateDispatch } from '~/store'
import { type AnalyzerWorker, spawnAnalyzerWorker } from '~/workers/analyzer'
import { LanguageID } from '../grammar'
import { getTimeNowUsageMarkers } from './time'
import { stripSlash } from '../autocomplete/utils'

type EditorInstance = monaco.editor.IStandaloneCodeEditor | null | undefined
type TimeoutId = ReturnType<typeof setTimeout>
export interface EnvironmentContext {
  isServerEnvironment?: boolean
}

const debounceInterval = 500

export class GoSyntaxChecker implements monaco.IDisposable {
  private readonly disposer: monaco.IDisposable
  private readonly worker: AnalyzerWorker
  private readonly timeoutId?: TimeoutId

  constructor(private readonly dispatcher: StateDispatch) {
    const [worker, disposer] = spawnAnalyzerWorker()
    this.worker = worker
    this.disposer = disposer
  }

  requestModelMarkers(
    model: monaco.editor.ITextModel | null | undefined,
    editor: EditorInstance,
    ctx: EnvironmentContext,
  ) {
    if (!editor || !model || model.getLanguageId() !== LanguageID.Go) {
      return
    }

    this.cancelScheduledChecks()
    setTimeout(() => {
      void this.checkModel(model, editor.getId(), ctx)
    }, debounceInterval)
  }

  cancelScheduledChecks() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId)
    }
  }

  private async checkModel(model: monaco.editor.ITextModel, editorId: string, ctx: EnvironmentContext) {
    // Code analysis contains 2 steps that run on different conditions:
    // 1. Add warnings to `time.Now` calls if code runs on server.
    // 2. Run Go worker if it's available and check for errors
    const fileName = model.uri.fsPath
    const markers: monaco.editor.IMarkerData[] = ctx.isServerEnvironment ? getTimeNowUsageMarkers(model) : []

    try {
      const response = await this.worker.checkSyntaxErrors({
        fileName,
        modelVersionId: model.getVersionId(),
        contents: model.getValue(),
      })

      if (response.fileName === fileName && response.markers) {
        markers.push(...response.markers)
      }
    } catch (err) {
      console.error('failed to perform syntax check', err)
    }

    monaco.editor.setModelMarkers(model, editorId, markers)
    this.dispatcher(newMarkerAction(stripSlash(fileName), markers))
  }

  dispose() {
    this.disposer.dispose()
  }
}
