import { v4 as uuid } from 'uuid'
import type * as monaco from 'monaco-editor'

enum MessageType {
  Exit = 'EXIT',
  Analyze = 'ANALYZE',
}

interface PromiseSubscription<T> {
  resolve: (result: T) => void
  reject: (err: any) => void
}

interface WorkerRequest<T> {
  id: string
  type: MessageType
  data: T
}

interface WorkerResponse<T> {
  id: string
  type: MessageType
  error?: string
  result?: T
}

export interface AnalyzeResult {
  hasErrors: boolean
  markers: monaco.editor.IMarkerData[]
}

export class Analyzer {
  private terminated = false
  private readonly worker: Worker
  private readonly subscriptions = new Map<string, PromiseSubscription<any>>()

  constructor() {
    this.worker = new Worker(new URL('../workers/analyzer.worker.ts', import.meta.url), {
      type: 'module',
    })
    this.worker.onmessage = (m) => {
      this.onMessage(m)
    }
  }

  async analyzeCode(code: string) {
    return await this.request<string, AnalyzeResult>(MessageType.Analyze, code)
  }

  async getMarkers(code: string) {
    const { markers } = await this.analyzeCode(code)
    return markers
  }

  dispose() {
    this.terminated = true
    this.worker.postMessage({ type: MessageType.Exit })
    setTimeout(() => {
      this.worker.terminate()
      this.cleanSubscriptions()
    }, 150)
  }

  private cleanSubscriptions() {
    this.subscriptions.forEach((val) => {
      val.reject('Analyzer is disposed')
    })
    this.subscriptions.clear()
  }

  private onMessage(e: MessageEvent) {
    if (this.terminated) {
      return
    }

    const data = e.data as WorkerResponse<any>
    const sub = this.subscriptions.get(data.id)
    if (!sub) {
      console.warn('analyzer: orphan worker event "%s"', data.id)
      return
    }

    const { resolve, reject } = sub
    this.subscriptions.delete(data.id)
    if (data.error) {
      reject(data.error)
      return
    }

    resolve(data.result)
  }

  private async request<I, O>(type: MessageType, data: I): Promise<O> {
    if (this.terminated) {
      throw new Error('Analyzer is disposed')
    }

    return await new Promise((resolve, reject) => {
      const id = uuid()
      const sub: PromiseSubscription<O> = { resolve, reject }
      this.subscriptions.set(id, sub)

      const msg: WorkerRequest<I> = { id, type, data }
      this.worker.postMessage(msg)
    })
  }

  static supported() {
    return 'WebAssembly' in window
  }
}
