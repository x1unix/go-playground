import { instantiateStreaming } from '~/lib/go/common'
import { getWasmUrl, wasmExecUrl } from '~/services/api/resources'

declare const self: DedicatedWorkerGlobalScope
// export default {} as typeof Worker & (new () => Worker)

const FN_EXIT = 'exit'
const TYPE_ANALYZE = 'ANALYZE'
const TYPE_EXIT = 'EXIT'

self.importScripts(wasmExecUrl)

function wrapModule(mod) {
  const wrapped = {
    // eslint-disable-next-line no-useless-call
    exit: () => mod.exit.call(mod),
  }
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  Object.keys(mod)
    .filter((k) => k !== FN_EXIT)
    .forEach((fnName) => {
      wrapped[fnName] = async (...args) =>
        await new Promise((resolve, reject) => {
          const cb = (rawResp) => {
            try {
              const resp = JSON.parse(rawResp)
              if (resp.error) {
                reject(new Error(`${fnName}: ${resp.error}`))
                return
              }

              resolve(resp.result)
            } catch (ex) {
              console.error(`analyzer: "${fnName}" returned and error`, ex)
              reject(new Error(`${fnName}: ${ex}`))
            }
          }

          const newArgs = args.concat(cb)
          mod[fnName].apply(self, newArgs)
        })
    })
  return wrapped
}

/**
 * WASM module load handler. Called by Go worker.
 */
function onModuleInit(module) {
  console.log('analyzer: started')
  module = wrapModule(module)
  onmessage = (msg) => {
    const { id, type, data } = msg.data
    switch (type) {
      case TYPE_ANALYZE:
        module
          .analyzeCode(data)
          .then((result) => {
            postMessage({ id, type, result })
          })
          .catch((error) => {
            postMessage({ id, type, error })
          })
        break
      case TYPE_EXIT:
        console.log('analyzer: exit')
        module.exit()
        break
      default:
        console.error('analyzer: unknown message type "%s"', type)
    }
  }
}

function main() {
  const workerUrl = getWasmUrl('analyzer')
  const go = new globalThis.Go()

  // Pass the entrypoint via argv.
  globalThis.onModuleInit = onModuleInit
  go.argv = ['js', 'onModuleInit']

  fetch(workerUrl)
    .then(async (rsp) => await instantiateStreaming(rsp, go.importObject))
    .then(({ instance }) => go.run(instance))
    .catch((err) => {
      console.error('analyzer: Go error ', err)
    })
}

main()
