import type { ITerminalAddon, Terminal } from '@xterm/xterm'
import { RenderingBackend } from '~/store/terminal'

type AddonFactory = () => ITerminalAddon

/**
 * Wrapper class for lazy retrieval and instantiation of XTerm.js addons.
 */
abstract class LazyTerminalAddon implements ITerminalAddon {
  static registry = new Map<RenderingBackend, AddonFactory>()

  private instance?: ITerminalAddon
  private pendingFactory?: Promise<AddonFactory>
  private isDisposed = false

  /**
   * Backend key to cache addon
   */
  protected abstract readonly backend: RenderingBackend

  /**
   * Addon factory provider
   */
  protected abstract getFactory(): Promise<AddonFactory>

  activate(terminal: Terminal): void {
    if (this.isDisposed) {
      return
    }

    if (this.instance) {
      // Activate if there is an instance already.
      this.instance.activate(terminal)
      return
    }

    // Try cache.
    const ctor = LazyTerminalAddon.registry.get(this.backend)
    if (ctor) {
      this.instance = ctor()
      this.instance.activate(terminal)
      return
    }

    // Otherwise, delayed activation.
    console.log(`xterm: fetching addon for backend "${this.backend}"`)
    this.pendingFactory ??= this.getFactory()
    this.pendingFactory
      .then((ctor) => {
        console.log(`xterm: loaded addon for backend "${this.backend}"`)
        LazyTerminalAddon.registry.set(this.backend, ctor)

        if (this.isDisposed) {
          console.log(`xterm: backend "${this.backend}" was disposed, skip activation.`)
          return
        }

        if (this.instance) {
          console.log(`xterm: backend "${this.backend}" already instantiated.`)
        }

        this.instance ??= ctor()
        this.instance.activate(terminal)
      })
      .catch((err) => {
        console.error(`xterm: failed to fetch addon for backend "${this.backend}"`, err)
      })
  }

  dispose(): void {
    if (this.isDisposed) {
      return
    }

    this.isDisposed = true
    this.instance?.dispose()
    this.instance = undefined
    console.log(`xterm: backend "${this.backend}" disposed`)
  }
}

/**
 * Lazy load wrapper around WebGL addon.
 */
export class LazyWebglAddon extends LazyTerminalAddon {
  protected backend = RenderingBackend.WebGL
  protected getFactory = async (): Promise<AddonFactory> => {
    const { WebglAddon } = await import('@xterm/addon-webgl')
    return () => new WebglAddon()
  }
}

/**
 * Lazy load wrapper around Canvas addon.
 */
export class LazyCanvasAddon extends LazyTerminalAddon {
  protected backend = RenderingBackend.Canvas
  protected getFactory = async (): Promise<AddonFactory> => {
    const { CanvasAddon } = await import('@xterm/addon-canvas')
    return () => new CanvasAddon()
  }
}
