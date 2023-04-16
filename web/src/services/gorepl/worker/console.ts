import {stringDecoder} from "~/lib/go";
import {Client} from "~/lib/wrpc";
import {ConsoleStreamType} from "~/lib/gowasm/bindings/stdio";
import {StdoutWriteEvent, WorkerEvent} from "./interface";

export class StdioWrapper {
  outputBuf = '';

  constructor(private rpcClient: Client) {}

  private getWriter(type: ConsoleStreamType) {
    return {
      write: (data: Uint8Array) => {
        this.outputBuf += stringDecoder.decode(data);
        const nl = this.outputBuf.lastIndexOf('\n');
        if (nl !== -1) {
          const message = this.outputBuf.substr(0, nl);
          this.rpcClient.publish<StdoutWriteEvent>(WorkerEvent.StdoutWrite, {
            msgType: type,
            message: message,
          });
          this.outputBuf = this.outputBuf.substr(nl + 1);
        }
        return data.length;
      }
    };
  }

  reset() {
    this.outputBuf = '';
  }

  get stdoutPipe() {
    return this.getWriter(ConsoleStreamType.Stdout);
  }

  get stderrPipe() {
    return this.getWriter(ConsoleStreamType.Stderr);
  }
}
