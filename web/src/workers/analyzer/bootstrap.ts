import type * as monaco from 'monaco-editor'
import '~/lib/go/wasm_exec.js'
import { getWasmUrl } from '~/services/api/resources'
import { instantiateStreaming } from '~/lib/go/common'

type JSONCallback = (rsp: string) => void
type CallArgs = [...any[], JSONCallback]

interface GoModule {
  analyzeCode: (code: string, cb: JSONCallback) => void
  exit: () => void
}

interface AnalyzeResult {
  hasErrors: boolean
  markers: monaco.editor.IMarkerData[] | null
}

export interface WrappedGoModule {
  analyzeCode: (code: string) => Promise<AnalyzeResult>
  exit: () => Promise<void>
}

interface GoResponse<T = any> {
  error: string
  result: T
}

const wrapModule = (mod: GoModule) => {
  const wrapped = {
    // eslint-disable-next-line no-useless-call
    exit: () => mod.exit.call(mod),
  }
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  Object.keys(mod)
    .filter((k) => k !== 'exit')
    .forEach((fnName) => {
      wrapped[fnName] = async (...args) =>
        await new Promise((resolve, reject) => {
          const cb = (rawResp) => {
            try {
              const resp: GoResponse = JSON.parse(rawResp)
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

          const newArgs = args.concat(cb) as CallArgs
          mod[fnName].apply(self, newArgs)
        })
    })
  return wrapped as WrappedGoModule
}

export const startAnalyzer = async (): Promise<WrappedGoModule> => {
  const workerUrl = getWasmUrl('analyzer')
  const go = new globalThis.Go()

  // Pass the entrypoint via argv.
  go.argv = ['js', 'onModuleInit']

  const rsp = await fetch(workerUrl)
  if (!rsp.ok) {
    throw new Error(`Failed to fetch worker: ${rsp.status} ${rsp.statusText}`)
  }

  const { instance } = await instantiateStreaming(rsp, go.importObject)
  return await new Promise((resolve, reject) => {
    // Hook called by Go program
    globalThis.onModuleInit = (goMod: GoModule) => {
      console.log('analyzer: started')
      const wrapped = wrapModule(goMod)
      return resolve(wrapped)
    }

    go.run(instance).catch((err: Error) => {
      reject(err)
    })
  })
}
