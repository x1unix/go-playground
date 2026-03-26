import type { Remote } from 'comlink'
import type { WorkerHandler } from './analyzer.worker'
import { WorkerRef } from '../types'

export type AnalyzerWorker = Remote<WorkerHandler>
export type AnalyzerWorkerRef = WorkerRef<WorkerHandler>

export const spawnAnalyzerWorker = (): AnalyzerWorkerRef =>
  new WorkerRef<WorkerHandler>(
    () =>
      new Worker(new URL('./analyzer.worker.ts', import.meta.url), {
        type: 'module',
      }),
  )
