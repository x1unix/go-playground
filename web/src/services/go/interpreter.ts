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
  js
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


export async function foo() {
  const go = new GoWrapper(new window.Go(), {
    debug: false,
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
