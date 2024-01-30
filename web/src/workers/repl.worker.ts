import '~/lib/go/wasm_exec.js'
import { Client } from '~/lib/wrpc'
import { stringEncoder } from '~/lib/go'
import { defaultWorkerConfig, type GoReplWorker, startGoWorker, type WorkerConfig } from '~/services/gorepl/worker'

declare const self: DedicatedWorkerGlobalScope

let worker: GoReplWorker | null = null

export const rpcClient = new Client(self, {
  init: async (cfg: WorkerConfig = defaultWorkerConfig) => {
    worker = await startGoWorker(self, rpcClient, cfg)
  },
  runProgram: (code: string) => {
    if (!worker) {
      throw new Error('Go WebAssembly worker is not ready yet')
    }

    const data = stringEncoder.encode(code)
    worker.runProgram(data.length, data)
  },
  terminateProgram: async () => {
    if (!worker) {
      return
    }

    worker.exit()
  },
  updateGoProxyAddress: (newAddress: string) => {
    if (!worker) {
      return
    }

    try {
      // eslint-disable-next-line no-new
      new URL(newAddress)
    } catch (ex) {
      throw new Error(`invalid Go module proxy URL "${newAddress}": ${ex}`)
    }

    worker.updateGoProxyAddress(newAddress)
  },
})
