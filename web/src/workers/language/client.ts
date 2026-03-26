import type { Remote } from 'comlink'
import type { WorkerHandler } from './language.worker'
import { WorkerRef } from '../types'

export type LanguageWorker = Remote<WorkerHandler>
export type LanguageWorkerRef = WorkerRef<WorkerHandler>

export const spawnLanguageWorker = (): LanguageWorkerRef =>
  new WorkerRef<WorkerHandler>(
    () =>
      new Worker(new URL('./language.worker.ts', import.meta.url), {
        type: 'module',
      }),
  )
