/**
 * Client-side environment for Go WASM programs
 */

import { decoder } from './foundation'
import { type IWriter } from './fs'
import { EvalEventKind } from '../api'

export interface ConsoleLogger {
  log: (eventType: EvalEventKind, message: string) => void
}

export class StdioWrapper {
  constructor(private readonly logger: ConsoleLogger) {}

  private getWriter(kind: EvalEventKind): IWriter {
    return {
      write: (data) => {
        const msg = decoder.decode(data)
        this.logger.log(kind, msg)
        return data.byteLength
      },
    }
  }

  reset() {}

  get stdoutPipe(): IWriter {
    return this.getWriter(EvalEventKind.Stdout)
  }

  get stderrPipe(): IWriter {
    return this.getWriter(EvalEventKind.Stderr)
  }
}
