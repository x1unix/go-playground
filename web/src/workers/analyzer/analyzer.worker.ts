import * as Comlink from 'comlink'
import { type WrappedGoModule, startAnalyzer } from './bootstrap'
import type { AnalyzeRequest, AnalyzeResponse } from './types'

// TODO: refactor this together with the Go worker API

const appendModelVersion = (markers: AnalyzeResponse['markers'], modelVersionId: number) => {
  if (!markers) {
    return null
  }

  return markers.map((marker) => ({ ...marker, modelVersionId }))
}

export class WorkerHandler {
  private mod?: WrappedGoModule
  private readonly initPromise = startAnalyzer()

  private async getModule() {
    this.mod ??= await this.initPromise
    return this.mod
  }

  async checkSyntaxErrors({ fileName, modelVersionId, contents }: AnalyzeRequest): Promise<AnalyzeResponse> {
    const mod = await this.getModule()
    const { markers } = await mod.analyzeCode(contents)
    return {
      fileName,
      modelVersionId,
      markers: appendModelVersion(markers, modelVersionId),
    }
  }
}

Comlink.expose(new WorkerHandler())
