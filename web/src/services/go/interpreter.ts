import {instantiateStreaming} from "@services/api";
import {
  Bool,
  GoStringType,
  GoWebAssemblyInstance,
  GoWrapper,
  Int32,
  Int64,
  Struct,
  Uint32,
  js, UintPtr
} from '~/lib/go';

const withPrefix = pfx => str => `${pfx}.${str}`;

const pkgPrefix = 'github.com/x1unix/go-playground/internal/gorepl/storage'

const storagePfx = withPrefix(pkgPrefix);

interface FileTx {
  id: number
  bufferSize: number
}

interface FileInfo {
  name: string
  size: number
  isDir: boolean
  mode: number
  modTime: number
}

interface FileEntry {
  pathName: string
  fileInfo: FileInfo
}

const TFileTx = Struct<FileTx>(storagePfx('fileTx'), [
  {key: 'id', type: Uint32},
  {key: 'bufferSize', type: Int32},
]);

const TFileInfo = Struct<FileInfo>(storagePfx('FileInfo'), [
  {key: 'name', type: GoStringType},
  {key: 'size', type: Int64},
  {key: 'isDir', type: Bool},
  {key: 'mode', type: Uint32},
  {key: 'modTime', type: Int64},
]);

const TFileEntry = Struct<FileEntry>(storagePfx('FileEntry'), [
  {key: 'pathName', type: GoStringType},
  {key: 'fileInfo', type: TFileInfo}
]);

class MessageAwaiter {
  subscriptions = new Map<number, Worker['onmessage']>();
  constructor(worker: Worker) {
    worker.onmessage = ((w, msg: MessageEvent<any>) => {
      this.handleMessage(w, msg);
    }) as Worker['onmessage'];
  }

  private handleMessage(w: Worker, msg: MessageEvent<any>) {
    console.log(msg);
  }

}

export async function foo() {
  const w = new Worker(new URL('../../workers/go.worker.ts', import.meta.url));
}

async function run() {
  const slotCount = 10;
  const slotPool = Array.from(Array(slotCount).keys());
  const allocatedSlots = new Set<number>();
  const shm = new SharedArrayBuffer(slotCount * Uint32.size);
  const i32 = new Int32Array(shm);
  const view = new DataView(shm);
  const requestAtomic = () => {
    const i = slotPool.pop();
    if (!i) {
      throw new Error('Atomic pool is empty');
    }

    if (allocatedSlots.has(i)) {
      throw new Error(`Atomic slot already taken: ${i}`);
    }

    allocatedSlots.add(i);
    view.setUint32(i * Int32.size, 0);
    return i;
  };

  const checkAtomicRef = ref => {
    if (ref >= i32.length) {
      throw new Error(`Atomic index is out of bounds (got: ${ref}, max: ${i32.length})`);
    }

    if (!allocatedSlots.has(ref)) {
      throw new Error(`Atomic slot is not allocated: ${ref}`);
    }
  }

  const go = new GoWrapper(new window.Go(), {
    debug: true
  });
  go.exportFunction(storagePfx('fileCreate'), (sp, reader) => {
    reader.skipHeader();
    const entry = reader.next<FileEntry>(TFileEntry);
    console.log('got entry', entry);
    reader.writer().write<FileTx>(TFileTx, {
      id: 255,
      bufferSize: 1024
    })
  });

  const mainPfx = withPrefix('github.com/x1unix/go-playground/internal/gorepl/tests');
  go.exportFunction(mainPfx('requestAtomic'), (sp, reader) => {
    reader.skipHeader();
    const i = requestAtomic();
    console.log('requestAtomic', i);
    reader.writer().write(UintPtr, i);
    // reader.dataView.buffer
  });

  go.exportFunction(mainPfx('waitForEvent'), (sp, reader) => {
    reader.skipHeader();
    const i = reader.next<number>(UintPtr);
    const timeout = reader.next<number>(Int32);
    checkAtomicRef(i);

    console.log('waitForEvent', i);
    Atomics.wait(i32, i, 0, timeout > 0 ? timeout : undefined);
    const result = i32[i];
    reader.writer().write(Int32, result);
  });

  go.exportFunction(mainPfx('releaseAtomic'), (sp, reader) => {
    reader.skipHeader();
    const i = reader.next<number>(UintPtr);
    checkAtomicRef(i);

    console.log('releaseAtomic', i);
    view.setUint32(i * Uint32.size, 0);
    slotPool.push(i);
    allocatedSlots.delete(i);
  })

  go.exportFunction(mainPfx('testAtomic'), (sp, reader) => {
    reader.skipHeader();
    const i = reader.next<number>(UintPtr);
    checkAtomicRef(i);

    console.log('testAtomic', i);
    setTimeout(() => {
      console.log('calling event for atomic', i);
      Atomics.store(i32, i, 32);
      Atomics.notify(i32, i, 1);
    }, 1000);

  })

  go.exportFunction(storagePfx('fileWrite'), (sp, reader) => {
  })

  go.exportFunction(storagePfx('fileCommit'), (sp, reader) => {
    const txId = reader.next<number>(Uint32);
    const awaitFunc = reader.next<js.Func>(js.FuncType);
    console.log('fileWrite', txId);
    setTimeout(() => {
      go.callFunc(awaitFunc, [2345, null]);
    }, 1000);
  })

  const {instance} = await instantiateStreaming(fetch('/go.wasm'), go.importObject);
  go.run(instance as GoWebAssemblyInstance)
    .then(() => console.log('execution finished'))
    .catch(console.error);
}
