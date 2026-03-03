import * as Comlink from 'comlink'
import type { WorkerHandler } from './analyzer.worker'

export type AnalyzerWorker = Comlink.Remote<WorkerHandler>

export interface Disposable {
  dispose(): void
}

export const spawnAnalyzerWorker = (): [AnalyzerWorker, Disposable] => {
  const worker = new Worker(new URL('./analyzer.worker.ts', import.meta.url), {
    type: 'module',
  })

  const proxy = Comlink.wrap<WorkerHandler>(worker)
  const dispose = {
    dispose: () => {
      proxy[Comlink.releaseProxy]()
      worker.terminate()
    },
  }

  return [proxy, dispose]
}
