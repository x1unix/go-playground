import * as Comlink from 'comlink'

export interface Disposable {
  dispose(): void
}

export class WorkerRef<T> {
  private proxy: Comlink.Remote<T> | null = null
  private worker: Worker | null = null
  private references = 0
  private disposePending = false

  constructor(private factory: () => Worker) {}

  private getRemote(): Comlink.Remote<T> {
    if (this.proxy && this.worker) {
      return this.proxy
    }

    const worker = this.factory()
    this.proxy = Comlink.wrap<T>(worker)
    this.worker = worker
    return this.proxy
  }

  private releaseRemote() {
    this.proxy?.[Comlink.releaseProxy]()
    this.worker?.terminate()
    this.proxy = null
    this.worker = null
  }

  async acquire<TResult>(callback: (worker: Comlink.Remote<T>) => Promise<TResult> | TResult): Promise<TResult> {
    this.references += 1

    try {
      const worker = this.getRemote()
      return await callback(worker)
    } finally {
      this.references -= 1

      if (this.disposePending && this.references === 0) {
        this.releaseRemote()
        this.disposePending = false
      }
    }
  }

  dispose() {
    this.disposePending = true

    if (this.references === 0) {
      this.releaseRemote()
      this.disposePending = false
    }
  }
}
