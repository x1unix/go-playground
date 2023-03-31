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
import {wrapGlobal} from "~/lib/go/wrapper/wrapper";

declare const self: DedicatedWorkerGlobalScope;
export default {} as typeof Worker & { new (): Worker };

const DEBUG = false;

self.importScripts('/wasm_exec.js')
export const instantiateStreaming = async (resp, importObject) => {
  if ('instantiateStreaming' in WebAssembly) {
    return await WebAssembly.instantiateStreaming(resp, importObject);
  }

  const source = await (await resp).arrayBuffer();
  return await WebAssembly.instantiate(source, importObject);
};

const withPrefix = pfx => str => `${pfx}.${str}`;

const pkgPrefix = 'github.com/x1unix/go-playground/internal/gorepl/storage';
const mainPfx = withPrefix('github.com/x1unix/go-playground/internal/gorepl/tests');
const storagePfx = withPrefix(pkgPrefix);



// const TFileTx = Struct<FileTx>(storagePfx('fileTx'), [
//   {key: 'id', type: Uint32},
//   {key: 'bufferSize', type: Int32},
// ]);
//
// const TFileInfo = Struct<FileInfo>(storagePfx('FileInfo'), [
//   {key: 'name', type: GoStringType},
//   {key: 'size', type: Int64},
//   {key: 'isDir', type: Bool},
//   {key: 'mode', type: Uint32},
//   {key: 'modTime', type: Int64},
// ]);
//
// const TFileEntry = Struct<FileEntry>(storagePfx('FileEntry'), [
//   {key: 'pathName', type: GoStringType},
//   {key: 'fileInfo', type: TFileInfo}
// ]);

async function run() {
  let handler: js.Func|null = null;
  const go = new GoWrapper(new self.Go(), {
    debug: DEBUG,
    globalValue: wrapGlobal({}, self)
  });

  go.exportFunction(mainPfx('registerCallbackHandler'), (sp, reader) => {
    reader.skipHeader();
    const goFn = reader.next<js.Func>(js.FuncType);
    console.log('js: received a func', goFn);
    handler = goFn;
  })

  go.exportFunction(mainPfx('doABarrelRoll'), (sp, reader) => {
    reader.skipHeader();
    const cbid = reader.next<number>(Int32);
    console.log('js: doABarellRoll - ', cbid)
    setTimeout(() => {
      console.log('js: pushing result', cbid);
      go.callFunc(handler!, [cbid, 255])
    }, 1000);
  })

  go.exportFunction(storagePfx('fileCreate'), (sp, reader) => {
    // reader.skipHeader();
    // const entry = reader.next<FileEntry>(TFileEntry);
    // console.log('got entry', entry);
    // reader.writer().write<FileTx>(TFileTx, {
    //   id: 255,
    //   bufferSize: 1024
    // })
  });

  go.exportFunction(storagePfx('fileWrite'), (sp, reader) => {
  })

  go.exportFunction(storagePfx('fileCommit'), (sp, reader) => {
    // const txId = reader.next<number>(Uint32);
    // const awaitFunc = reader.next<js.Func>(js.FuncType);
    // console.log('fileWrite', txId);
    // setTimeout(() => {
    //   go.callFunc(awaitFunc, [2345, null]);
    // }, 1000);
  })

  const {instance} = await instantiateStreaming(fetch('/go.wasm'), go.importObject);
  go.run(instance as GoWebAssemblyInstance)
    .then(() => console.log('execution finished'))
    .catch(console.error);
}

run().then(() => console.log('RUN OK')).catch(err => console.error('RUN ERR-', err))
