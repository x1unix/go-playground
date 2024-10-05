import * as Comlink from 'comlink'
import type { WorkerHandler } from './language.worker'

export type LanguageWorker = Comlink.Remote<WorkerHandler>

let worker: LanguageWorker

const spawnWorker = (): LanguageWorker => {
  const worker = new Worker(new URL('./language.worker.ts', import.meta.url), {
    type: 'module',
  })

  return Comlink.wrap<WorkerHandler>(worker)
}

export const getLanguageWorker = () => {
  worker ??= spawnWorker()
  return worker
}
