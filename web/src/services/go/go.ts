import { IFileSystem } from './fs';
import { encoder, decoder } from './foundation';

// Doesn't work (idk why), Go throws "undefined" errors
// Use "wasm_exec.js" for now

const MAX_UINT32 = 4294967296;
const NAN_HEAD = 0x7FF80000;
const MS_IN_NANO = 1000000;

export interface Global extends Window {
  fs: IFileSystem
  process: NodeJS.Process
}

/**
 * Go runtime bridge
 *
 * src: wasm_exec.js:132 from Go 1.14
 */
export class Go {
  argv = ['js'];
  env: { [k: string]: string } = {};
  timeOrigin = Date.now() - performance.now();
  private lastExitCode = 0;
  private pendingEvent: any = null;
  private _scheduledTimeouts = new Map<number, any>();
  private _nextCallbackTimeoutID = 1;
  private _resolveExitPromise?: (exitCode: number) => void;
  private exitPromise = new Promise<number>((resolve) => {
    this._resolveExitPromise = resolve;
  });
  public _inst: any;

  public mem?: DataView;

  /**
   * whether the Go program has exited
   */
  exited = false;

  /**
   * JS values that Go currently has references to, indexed by reference id
   */
  public _values: any[] = [];

  /**
   * mapping from JS values to reference ids
   */
  public _ids = new Map();

  /**
   * unused ids that have been garbage collected
   */
  public _idPool: number[] = [];

  /**
   * number of references that Go has to a JS value, indexed by reference id
   */
  public _goRefCounts: number[] = [];

  constructor(private global: Global) {
    this._values = [];
    this._ids = new Map();
  }

  setInt64(addr, v) {
    if (!this.mem) return;
    this.mem.setUint32(addr + 0, v, true);
    this.mem.setUint32(addr + 4, Math.floor(v / MAX_UINT32), true);
  }

  getInt64(addr) {
    if (!this.mem) return 0;
    const low = this.mem.getUint32(addr + 0, true);
    const high = this.mem.getInt32(addr + 4, true);
    return low + high * MAX_UINT32;
  }

  loadValue(addr: number) {
    if (!this.mem) return;
    const f = this.mem.getFloat64(addr, true);
    if (f === 0) {
      return undefined;
    }
    if (!isNaN(f)) {
      return f;
    }

    const id = this.mem.getUint32(addr, true);
    return this._values[id];
  }

  storeValue(addr, v) {
    if (!this.mem) return;
    // line 172
    if (typeof v === "number") {
      if (isNaN(v)) {
        this.mem.setUint32(addr + 4, NAN_HEAD, true);
        this.mem.setUint32(addr, 0, true);
        return;
      }
      if (v === 0) {
        this.mem.setUint32(addr + 4, NAN_HEAD, true);
        this.mem.setUint32(addr, 1, true);
        return;
      }
      this.mem.setFloat64(addr, v, true);
      return;
    }

    switch (v) {
      case undefined:
        this.mem.setFloat64(addr, 0, true);
        return;
      case null:
        this.mem.setUint32(addr + 4, NAN_HEAD, true);
        this.mem.setUint32(addr, 2, true);
        return;
      case true:
        this.mem.setUint32(addr + 4, NAN_HEAD, true);
        this.mem.setUint32(addr, 3, true);
        return;
      case false:
        this.mem.setUint32(addr + 4, NAN_HEAD, true);
        this.mem.setUint32(addr, 4, true);
        return;
    }

    let id = this._ids.get(v);
    if (id === undefined) {
      id = this._idPool.pop();
      if (id === undefined) {
        id = this._values.length;
      }
      this._values[id] = v;
      this._goRefCounts[id] = 0;
      this._ids.set(v, id);
    }
    this._goRefCounts[id]++;

    let typeFlag = 1;
    switch (typeof v) {
      case "string":
        typeFlag = 2;
        break;
      case "symbol":
        typeFlag = 3;
        break;
      case "function":
        typeFlag = 4;
        break;
    }
    this.mem.setUint32(addr + 4, NAN_HEAD | typeFlag, true);
    this.mem.setUint32(addr, id, true);
  }

  loadSlice(addr) {
    const array = this.getInt64(addr + 0);
    const len = this.getInt64(addr + 8);
    return new Uint8Array(this._inst.exports.mem.buffer, array, len);
  }

  loadSliceOfValues(addr) {
    const array = this.getInt64(addr + 0);
    const len = this.getInt64(addr + 8);
    const a = new Array(len);
    for (let i = 0; i < len; i++) {
      a[i] = this.loadValue(array + i * 8);
    }
    return a;
  }

  loadString(addr) {
    const saddr = this.getInt64(addr + 0);
    const len = this.getInt64(addr + 8);
    return decoder.decode(new DataView(this._inst.exports.mem.buffer, saddr, len));
  }

  importObject = {
    go: {
      // Go's SP does not change as long as no Go code is running. Some operations (e.g. calls, getters and setters)
      // may synchronously trigger a Go event handler. This makes Go code get executed in the middle of the imported
      // function. A goroutine can switch to a new stack if the current stack is too small (see morestack function).
      // This changes the SP, thus we have to update the SP used by the imported function.

      // func wasmExit(code int32)
      "runtime.wasmExit": (sp) => {
        if (!this.mem) return;
        const code = this.mem.getInt32(sp + 8, true);
        this.exited = true;
        delete this._inst; // @ts-ignore
        delete this._values; // @ts-ignore
        delete this._goRefCounts; // @ts-ignore
        delete this._ids; // @ts-ignore
        delete this._idPool;
        this.exit(code);
      },

      // func wasmWrite(fd uintptr, p unsafe.Pointer, n int32)
      "runtime.wasmWrite": (sp) => {
        if (!this.mem) return;
        const fd = this.getInt64(sp + 8);
        const p = this.getInt64(sp + 16);
        const n = this.mem.getInt32(sp + 24, true);
        this.global.fs.writeSync(fd, new Uint8Array(this._inst.exports.mem.buffer, p, n));
      },

      // func resetMemoryDataView()
      "runtime.resetMemoryDataView": (sp) => {
        this.mem = new DataView(this._inst.exports.mem.buffer);
      },

      // func nanotime1() int64
      "runtime.nanotime1": (sp) => {
        this.setInt64(sp + 8, (this.timeOrigin + performance.now()) * MS_IN_NANO);
      },

      // func walltime1() (sec int64, nsec int32)
      "runtime.walltime1": (sp) => {
        const msec = (new Date()).getTime();
        this.setInt64(sp + 8, msec / 1000);
        this.mem?.setInt32(sp + 16, (msec % 1000) * MS_IN_NANO, true);
      },

      // func scheduleTimeoutEvent(delay int64) int32
      "runtime.scheduleTimeoutEvent": (sp) => {
        const id = this._nextCallbackTimeoutID;
        this._nextCallbackTimeoutID++;
        this._scheduledTimeouts.set(id, setTimeout(
          () => {
            this._resume();
            while (this._scheduledTimeouts.has(id)) {
              // for some reason Go failed to register the timeout event, log and try again
              // (temporary workaround for https://github.com/golang/go/issues/28975)
              console.warn("scheduleTimeoutEvent: missed timeout event");
              this._resume();
            }
          },
          this.getInt64(sp + 8) + 1, // setTimeout has been seen to fire up to 1 millisecond early
        ));
        this.mem?.setInt32(sp + 16, id, true);
      },

      // func clearTimeoutEvent(id int32)
      "runtime.clearTimeoutEvent": (sp) => {
        if (!this.mem) return;
        const id = this.mem.getInt32(sp + 8, true);
        clearTimeout(this._scheduledTimeouts.get(id));
        this._scheduledTimeouts.delete(id);
      },

      // func getRandomData(r []byte)
      "runtime.getRandomData": (sp) => {
        crypto.getRandomValues(this.loadSlice(sp + 8));
      },

      // func finalizeRef(v ref)
      "syscall/js.finalizeRef": (sp) => {
        if (!this.mem) return;
        const id = this.mem.getUint32(sp + 8, true);
        this._goRefCounts[id]--;
        if (this._goRefCounts[id] === 0) {
          const v = this._values[id];
          this._values[id] = null;
          this._ids.delete(v);
          this._idPool.push(id);
        }
      },

      // func stringVal(value string) ref
      "syscall/js.stringVal": (sp) => {
        this.storeValue(sp + 24, this.loadString(sp + 8));
      },

      // func valueGet(v ref, p string) ref
      "syscall/js.valueGet": (sp) => {
        const result = Reflect.get(this.loadValue(sp + 8), this.loadString(sp + 16));
        sp = this._inst.exports.getsp(); // see comment above
        this.storeValue(sp + 32, result);
      },

      // func valueSet(v ref, p string, x ref)
      "syscall/js.valueSet": (sp) => {
        Reflect.set(this.loadValue(sp + 8), this.loadString(sp + 16), this.loadValue(sp + 32));
      },

      // func valueDelete(v ref, p string)
      "syscall/js.valueDelete": (sp) => {
        Reflect.deleteProperty(this.loadValue(sp + 8), this.loadString(sp + 16));
      },

      // func valueIndex(v ref, i int) ref
      "syscall/js.valueIndex": (sp) => {
        this.storeValue(sp + 24, Reflect.get(this.loadValue(sp + 8), this.getInt64(sp + 16)));
      },

      // valueSetIndex(v ref, i int, x ref)
      "syscall/js.valueSetIndex": (sp) => {
        Reflect.set(this.loadValue(sp + 8), this.getInt64(sp + 16), this.loadValue(sp + 24));
      },

      // func valueCall(v ref, m string, args []ref) (ref, bool)
      "syscall/js.valueCall": (sp) => {
        try {
          const v = this.loadValue(sp + 8);
          const m = Reflect.get(v, this.loadString(sp + 16));
          const args = this.loadSliceOfValues(sp + 32);
          const result = Reflect.apply(m, v, args);
          sp = this._inst.exports.getsp(); // see comment above
          this.storeValue(sp + 56, result);
          this.mem?.setUint8(sp + 64, 1);
        } catch (err) {
          this.storeValue(sp + 56, err);
          this.mem?.setUint8(sp + 64, 0);
        }
      },

      // func valueInvoke(v ref, args []ref) (ref, bool)
      "syscall/js.valueInvoke": (sp) => {
        try {
          const v = this.loadValue(sp + 8);
          const args = this.loadSliceOfValues(sp + 16);
          const result = Reflect.apply(v, undefined, args);
          sp = this._inst.exports.getsp(); // see comment above
          this.storeValue(sp + 40, result);
          this.mem?.setUint8(sp + 48, 1);
        } catch (err) {
          this.storeValue(sp + 40, err);
          this.mem?.setUint8(sp + 48, 0);
        }
      },

      // func valueNew(v ref, args []ref) (ref, bool)
      "syscall/js.valueNew": (sp) => {
        try {
          const v = this.loadValue(sp + 8);
          const args = this.loadSliceOfValues(sp + 16);
          const result = Reflect.construct(v, args);
          sp = this._inst.exports.getsp(); // see comment above
          this.storeValue(sp + 40, result);
          this.mem?.setUint8(sp + 48, 1);
        } catch (err) {
          this.storeValue(sp + 40, err);
          this.mem?.setUint8(sp + 48, 0);
        }
      },

      // func valueLength(v ref) int
      "syscall/js.valueLength": (sp) => {
        this.setInt64(sp + 16, parseInt(this.loadValue(sp + 8).length));
      },

      // valuePrepareString(v ref) (ref, int)
      "syscall/js.valuePrepareString": (sp) => {
        const str = encoder.encode(String(this.loadValue(sp + 8)));
        this.storeValue(sp + 16, str);
        this.setInt64(sp + 24, str.length);
      },

      // valueLoadString(v ref, b []byte)
      "syscall/js.valueLoadString": (sp) => {
        const str = this.loadValue(sp + 8);
        this.loadSlice(sp + 16).set(str);
      },

      // func valueInstanceOf(v ref, t ref) bool
      "syscall/js.valueInstanceOf": (sp) => {
        this.mem?.setUint8(sp + 24, Number(this.loadValue(sp + 8) instanceof this.loadValue(sp + 16)));
      },

      // func copyBytesToGo(dst []byte, src ref) (int, bool)
      "syscall/js.copyBytesToGo": (sp) => {
        const dst = this.loadSlice(sp + 8);
        const src = this.loadValue(sp + 32);
        if (!(src instanceof Uint8Array)) {
          this.mem?.setUint8(sp + 48, 0);
          return;
        }
        const toCopy = src.subarray(0, dst.length);
        dst.set(toCopy);
        this.setInt64(sp + 40, toCopy.length);
        this.mem?.setUint8(sp + 48, 1);
      },

      // func copyBytesToJS(dst ref, src []byte) (int, bool)
      "syscall/js.copyBytesToJS": (sp) => {
        const dst = this.loadValue(sp + 8);
        const src = this.loadSlice(sp + 16);
        if (!(dst instanceof Uint8Array)) {
          this.mem?.setUint8(sp + 48, 0);
          return;
        }
        const toCopy = src.subarray(0, dst.length);
        dst.set(toCopy);
        this.setInt64(sp + 40, toCopy.length);
        this.mem?.setUint8(sp + 48, 1);
      },

      "debug": (value) => {
        console.log(value);
      },
    },
  };

  public async run(instance: WebAssembly.Instance): Promise<number> {
    this.lastExitCode = 0;
    this._inst = instance;
    const mem = new DataView(this._inst.exports.mem.buffer);
    this.mem = mem;
    this._values = [ // JS values that Go currently has references to, indexed by reference id
      NaN,
      0,
      null,
      true,
      false,
      this.global,
      this,
    ];
    this._goRefCounts = []; // number of references that Go has to a JS value, indexed by reference id
    this._ids = new Map();  // mapping from JS values to reference ids
    this._idPool = [];      // unused ids that have been garbage collected
    this.exited = false;    // whether the Go program has exited

    // Pass command line arguments and environment variables to WebAssembly by writing them to the linear memory.
    let offset = 4096;

    const strPtr = (str) => {
      const ptr = offset;
      const bytes = encoder.encode(str + "\0");
      new Uint8Array(mem.buffer, offset, bytes.length).set(bytes);
      offset += bytes.length;
      if (offset % 8 !== 0) {
        offset += 8 - (offset % 8);
      }
      return ptr;
    };

    const argc = this.argv.length;

    const argvPtrs: number[] = [];
    this.argv.forEach((arg) => {
      argvPtrs.push(strPtr(arg));
    });
    argvPtrs.push(0);

    const keys = Object.keys(this.env).sort();
    keys.forEach((key) => {
      argvPtrs.push(strPtr(`${key}=${this.env[key]}`));
    });
    argvPtrs.push(0);

    const argv = offset;
    argvPtrs.forEach((ptr) => {
      mem.setUint32(offset, ptr, true);
      mem.setUint32(offset + 4, 0, true);
      offset += 8;
    });

    this._inst.exports.run(argc, argv);
    if (this.exited) {
      this._resolveExitPromise && this._resolveExitPromise(this.lastExitCode);
    }
    return await this.exitPromise;
  }

  _resume() {
    if (this.exited) {
      throw new Error("Go program has already exited");
    }
    this._inst.exports.resume();
    if (this.exited) {
      this._resolveExitPromise && this._resolveExitPromise(this.lastExitCode);
    }
  }

  _makeFuncWrapper(id) {
    const go = this;
    return function () {
      // @ts-ignore
      const event: any = { id: id, this: this, args: arguments };
      go.pendingEvent = event;
      go._resume();
      return event.result;
    };
  }

  exit(code = 0) {
    this.lastExitCode = code;
  }
}
