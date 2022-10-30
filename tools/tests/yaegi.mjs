import { promises as fs } from 'fs';
import fetch from 'node-fetch';
import * as fsOld from 'fs';
import * as path from 'path';
import * as os from 'os';
import {fileURLToPath} from 'url';
import { Go } from './wasm-misc/wasm_exec_original.mjs';

const code = `
import (
    "fmt"
    "go.uber.org/zap"
)

func main() {
    logger, _ := zap.NewDevelopment()
    logger.Info("test zap")
    fmt.Println("Hello from yaegi")
}
`

const promiseToCallback = (fn, cb) => (...args) => {
  fn(...args).then(r => cb(null, r)).catch(err => cb(err, null))
}

global.main = ({evaluate, registerPackageProvider, exit}) => {
  registerPackageProvider({
    "open": promiseToCallback(async (file) => {
      console.log('registerPackageProvider.open:', file);
      throw new Error(`Not Implemented`)
    }),
    "read": promiseToCallback(async (file) => {
      console.log('registerPackageProvider.read:', file);
      throw new Error(`Not Implemented`)
    }),
    "stat": promiseToCallback(async (file) => {
      console.log('registerPackageProvider.stat:', file);
      throw new Error(`Not Implemented`)
    }),
    "close": promiseToCallback(async (file) => {
      console.log('registerPackageProvider.close:', file);
      throw new Error(`Not Implemented`)
    }),
  }, () => {})
  evaluate(code, (rsp, err) => {
    if (err) {
      console.error('Error from func:', err);
      return;
    }

    console.log('result:', rsp);
  });
};

const go = new Go({
  ...global,
  fs: fsOld,
  window: global,
  testfunc: () => console.log('hello world!')
});
go.argv = ['js', 'main'];
go.env = { TMPDIR: os.tmpdir(), ...process.env};



const wasmFile = path.join(path.dirname(fileURLToPath(import.meta.url)), 'go.wasm');
console.log(':: Loading WASM file %s...', wasmFile);
const buff = await fs.readFile(wasmFile);
const {instance} = await WebAssembly.instantiate(buff, go.importObject);
await go.run(instance);