import * as Comlink from 'comlink'

export interface Disposable {
  dispose(): void
}

/**
 * Reference-counted wrapper for Comlink workers with lazy initialization.
 *
 * Workers are created on-demand when `acquire()` is first called.
 * Supports graceful shutdown via `dispose()` - waits for all in-flight
 * operations to complete before terminating the worker.
 *
 * After disposal, calling `acquire()` will spawn a new worker instance,
 * allowing the ref to be reused across HMR or component remounts.
 */
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

  /**
   * Executes a callback with access to the worker proxy.
   *
   * The worker is lazily created on first call. Reference counting ensures
   * the worker won't be terminated while the callback is executing.
   */
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

  /**
   * Initiates graceful shutdown of the worker.
   *
   * If operations are in-flight, termination is deferred until all complete.
   * The WorkerRef remains usable after disposal - subsequent `acquire()` calls
   * will spawn a fresh worker instance.
   */
  dispose() {
    this.disposePending = true

    if (this.references === 0) {
      this.releaseRemote()
      this.disposePending = false
    }
  }
}
