import * as Comlink from 'comlink'
import { formatDuration } from '~/utils/format'
import type { StartupParams, GoExecutor, WriteListener } from './types'

const WORKER_START_TIMEOUT = 30 * 1000

type WriteHandler = (data: ArrayBuffer, isStderr: boolean) => void

interface SyncStdio {
  stdout: WriteListener
  stderr: WriteListener
}

export const createStdio = (handler: WriteHandler): SyncStdio => {
  return {
    stdout: Comlink.proxy((data) => handler(data, false)),
    stderr: Comlink.proxy((data) => handler(data, true)),
  }
}

const withDeadline = async <T>(func: () => Promise<T>, deadline: number): Promise<T> => {
  return await new Promise((resolve, reject) => {
    let deadlineExceeded = false
    const tid = setTimeout(() => {
      deadlineExceeded = true
      reject(new Error(`Go worker start timeout exceeded (${formatDuration(deadline)})`))
    }, deadline)

    func()
      .then((res) => {
        if (!deadlineExceeded) {
          clearTimeout(tid)
          resolve(res)
        }
      })
      .catch((err) => {
        if (!deadlineExceeded) {
          clearTimeout(tid)
          reject(err)
        }
      })
  })
}

/**
 * Helper to start and stop Go WebAssembly programs in background.
 */
export class GoProcess {
  private worker?: Worker

  /**
   * Starts Go program in a separate worker and returns process exit code.
   *
   * @see `makeStdio` to create i/o streams handler.
   *
   * @param image WebAssembly program code.
   * @param stdio Standard i/o streams.
   * @param params Program startup params.
   */
  async start(image: ArrayBuffer, stdio: SyncStdio, params?: StartupParams) {
    this.worker = new Worker(new URL('./worker.ts', import.meta.url), {
      type: 'module',
    })

    const proxy = Comlink.wrap<GoExecutor>(this.worker)
    await withDeadline(async () => {
      return await proxy.initialize(Comlink.proxy(stdio))
    }, WORKER_START_TIMEOUT)

    return await proxy.run(Comlink.transfer({ image, params }, [image]))
  }

  /**
   * Terminates current Go program.
   */
  terminate() {
    this.worker?.terminate()
  }
}
