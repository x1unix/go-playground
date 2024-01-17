/**
 * Client-side environment for Go WASM programs
 */

import { decoder } from './foundation';
import { IWriter } from './fs';
import { EvalEventKind } from '../api';

export interface ConsoleLogger {
  log(eventType: EvalEventKind, message: string): void
}

export class StdioWrapper {
  constructor(private logger: ConsoleLogger) { }

  private getWriter(kind: EvalEventKind) {
    return {
      write: (data: Uint8Array) => {
        const msg = decoder.decode(data);
        this.logger.log(kind, msg);
        return data.length;
      }
    };
  }

  reset() {
  }

  get stdoutPipe(): IWriter {
    return this.getWriter(EvalEventKind.Stdout);
  }

  get stderrPipe(): IWriter {
    return this.getWriter(EvalEventKind.Stderr);
  }
}
