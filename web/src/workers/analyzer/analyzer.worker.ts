import * as Comlink from 'comlink'
import { type WrappedGoModule, startAnalyzer } from './bootstrap'
import type { AnalyzeRequest, AnalyzeResponse } from './types'

// TODO: refactor this together with the Go worker API

export class WorkerHandler {
  private mod?: WrappedGoModule
  private readonly initPromise = startAnalyzer()

  private async getModule() {
    this.mod ??= await this.initPromise
    return this.mod
  }

  async checkSyntaxErrors({ fileName, contents }: AnalyzeRequest): Promise<AnalyzeResponse> {
    const mod = await this.getModule()
    const { markers } = await mod.analyzeCode(contents)
    return {
      fileName,
      markers,
    }
  }
}

Comlink.expose(new WorkerHandler())
