import { type Event, type Message, MessageType, type Request, type Response } from './protocol'

const MSG_PING = 'WRPC_WORKER_PING'

interface WorkerInterface extends AbstractWorker {
  postMessage: (message: any, transfer?: Transferable[]) => any
}

interface Listener {
  resolver: Function
  rejector: Function
  timeoutId?: NodeJS.Timeout | null
}

interface Subscription {
  id: number
  handler: Function
}

interface CallOpts {
  timeout?: number
}

type Handler = Record<string, (...args) => Promise<any> | any | void>

const newRequestID = () => Date.now()

/**
 * Client is bidirectional RPC and message broker client between worker and window.
 */
export class Client<H = Handler> {
  private readonly responseQueue = new Map<number, Listener>()
  private readonly subscriptions = new Map<string, Subscription[]>()

  constructor(
    private readonly worker: WorkerInterface,
    private handler?: H | null,
  ) {
    worker.addEventListener('error', (e) => {
      this.handleWorkerError(e)
    })
    worker.addEventListener('message', (e) => {
      this.handleMessage(e)
    })
    worker.addEventListener('messageerror', (e) => {
      this.handleMessageError(e)
    })
  }

  /**
   * Dispose all client resources
   */
  dispose() {
    this.responseQueue.clear()
    this.subscriptions.clear()
    this.handler = null
  }

  /**
   * Sends request
   *
   * @param methodName
   * @param body
   * @param opts
   */
  async call<V = any, R = any>(methodName: string, body: V, opts?: CallOpts): Promise<R> {
    const reqId = newRequestID()

    return await new Promise<R>((res, rej) => {
      const req: Message<Request<V>> = {
        type: MessageType.Request,
        payload: {
          id: reqId,
          method: methodName,
          params: body,
        },
      }

      this.worker.postMessage(req)
      this.responseQueue.set(reqId, {
        resolver: res,
        rejector: rej,
        timeoutId: opts?.timeout
          ? setTimeout(() => {
              if (!this.responseQueue.has(reqId)) {
                return
              }

              this.responseQueue.delete(reqId)
              rej(new Error('request timeout exceeded'))
            }, opts.timeout)
          : null,
      })
    })
  }

  /**
   * Ping worker
   * @param timeout response timeout in milliseconds
   */
  async ping(timeout = 30000): Promise<void> {
    await this.call(MSG_PING, null, {
      timeout,
    })
  }

  /**
   * Subscribe and listen for an event.
   *
   * Returns subscription ID.
   *
   * @param event Event name
   * @param handler Event handler
   */
  subscribe<T = any>(event: string, handler: (message: T) => void): number {
    const id = newRequestID()

    const subs = this.subscriptions.get(event)
    this.subscriptions.set(event, subs ? subs.concat({ id, handler }) : [{ id, handler }])
    return id
  }

  /**
   * Publish a new message for event.
   *
   * @param event Event name
   * @param payload Payload
   */
  publish<T = any>(event: string, payload: T) {
    const msg: Message<Event<T>> = {
      type: MessageType.Event,
      payload: {
        name: event,
        payload,
      },
    }

    this.worker.postMessage(msg)
  }

  /**
   * Remove event listener by subscription id.
   *
   * @param event Event name.
   * @param subscriptionId Subscription ID.
   */
  unsubscribe(event: string, subscriptionId: number) {
    const subs = this.subscriptions.get(event)
    if (!subs) {
      return
    }

    this.subscriptions.set(
      event,
      subs.filter(({ id }) => subscriptionId !== id),
    )
  }

  private handleResponse({ id, err, result }: Response) {
    const awaiter = this.responseQueue.get(id)
    if (!awaiter) {
      return
    }

    if (awaiter.timeoutId) {
      clearTimeout(awaiter.timeoutId)
    }

    this.responseQueue.delete(id)
    if (err) {
      awaiter.rejector(new Error(err.message ?? err))
      return
    }

    awaiter.resolver(result)
  }

  private handleEvent(rsp: Event) {
    const handlers = this.subscriptions.get(rsp.name)
    if (!handlers?.length) {
      return
    }

    handlers.forEach(({ handler }) => handler(rsp.payload))
  }

  private async handleRequest(req: Request) {
    const { method } = req
    if (method === MSG_PING) {
      this.sendResponse(req, 'PONG', null)
      return
    }

    if (!this.handler || !this.handler[method]) {
      this.sendResponse(req, null, 'Method not found')
      return
    }

    const handlerFunc = this.handler[method]
    if (typeof handlerFunc !== 'function') {
      this.sendResponse(req, null, 'Method not found')
      return
    }

    try {
      let result = handlerFunc(req.params)
      if (result instanceof Promise) {
        result = await result
      }

      this.sendResponse(req, result, null)
    } catch (err) {
      this.sendResponse(req, null, err)
    }
  }

  private sendResponse(req: Request, data: any, error: any) {
    const msg: Message<Response> = {
      type: MessageType.Response,
      payload: {
        id: req.id,
        method: req.method,
        err: error?.message ?? error,
        result: data,
      },
    }

    this.worker.postMessage(msg)
  }

  private handleMessage(ev: MessageEvent<any>) {
    const { type, payload } = ev.data as Message
    switch (type) {
      case MessageType.Request:
        this.handleRequest(payload as Request)
        break
      case MessageType.Response:
        this.handleResponse(payload as Response)
        break
      case MessageType.Event:
        this.handleEvent(payload as Event)
        break
      default:
        console.warn(`Unknown message type: ${type}`)
        break
    }
  }

  private handleMessageError(msg: MessageEvent) {
    console.error('wrpc: message error', msg)
    const { type, payload } = msg.data as Message
    if (type !== MessageType.Response) {
      return
    }

    const handler = this.responseQueue.get(payload.id)
    if (!handler) {
      return
    }

    this.responseQueue.delete(payload.id)
    handler.rejector(new Error('Worker returned onmessageerror'))
  }

  private handleWorkerError(event: ErrorEvent) {
    // Discard all pending promises in case of worker init issue.
    // Any issues occur before worker script was fetched don't contain message.
    console.error('wrpc: worker returned an error: ', event)
    const err = new Error(event.message ?? 'Failed to initialize Go WebWorker')
    this.responseQueue.forEach((listener) => {
      listener.rejector(err)
      if (listener.timeoutId) {
        clearTimeout(listener.timeoutId)
      }
    })

    this.responseQueue.clear()
  }
}
