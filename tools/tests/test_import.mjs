import './polyfill.js';
import { promises as fs } from 'fs';
import { Types, Struct } from './lib/Types/types.mjs';
import Go from './custom-go.mjs';

const num2hex = val => typeof val === 'bigint' ? num2hex(Number(val)) : val.toString(16);
const hex = v => typeof v === 'string' ? parseInt(v, 16) : num2hex(v);
const go = new Go({debug: true});

const JSValue = Struct('syscall/js.Value', [
  {key: 'ref', type: Types.Uint64},
  {key: 'gcPtr', type: Types.UintPtr}
])
const JSFunc = Struct('syscall/js.Func', [
  { key: 'value', type: JSValue },
  { key: 'id', type: Types.Uint32 }
]);

go.exportFunction('main.readJSFunc', (sp, reader) => {
  reader.skipHeader();
  /*
    ref = uint64
    Value:
      ref: ref
      gcPtr: uintptr[ref]
    id: uint32
   */
  // const func = {
  //   value: {
  //     ref: reader.pop(Types.Uint64),
  //     gcPtr: reader.pop(Types.UintPtr)
  //   },
  //   id: reader.pop(Types.Uint32)
  // }
  const func = reader.pop(JSFunc);

  console.log([
    '--- GOT: ---',
    'Func: {',
    `\tValue: {`,
    `\t\tref: ${func.value.ref} (${hex(func.value.ref)})`,
    `\t\tgcPtr: ${hex(func.value.gcPtr)}`,
    `\t}`,
    `\tid: ${func.id} (${hex(func.id)})`,
    '}',
    '------------',
  ].join('\n'));
  console.log(func);
  console.log(go.inspector.dump(sp, 64, 16));
})

go.exportFunction('main.sum2', (sp, reader) => {
  reader.skipHeader();
  const [a1, a2] = reader.popTimes(Types.Int, 2)
  const r1 = a2 + 1;
  const r2 = a1 + a2;

  reader
    .writer()
    .write(Types.Int, r1)
    .write(Types.Int, r2);

  console.log(go.inspector.dump(sp, 64, 16));
})

go.exportFunction('main.dialByFuncRef', sp => {
  const aligned = alignAddr(sp, 4);
  const funcId = go.mem.getUint32(aligned + Sizeof.UINT32, true);
  // const funcId = go.mem.getUint32(sp + Sizeof.UINT64, true);
  // const funcId2 = go.mem.getUint32(sp + (Sizeof.UINT64 + Sizeof.UINT32), true);
  // console.log({
  //   sp,
  //   al1: alignAddr(sp, 4),
  //   spa1: sp + Sizeof.UINT64,
  //   spa2: sp + (Sizeof.UINT64 + Sizeof.UINT32),
  //   al2: alignAddr(sp + (Sizeof.UINT64 + Sizeof.UINT32), 4),
  //   funcId,
  //   funcId2,
  // });
})

const buff = await fs.readFile('./testmod/main.wasm');
const {instance} = await WebAssembly.instantiate(buff, go.importObject);
await go.run(instance);
