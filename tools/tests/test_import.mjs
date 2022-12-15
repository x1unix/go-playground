import './polyfill.js';
import { promises as fs } from 'fs';
import { Types } from './lib/Types/types.mjs';
import Go from './custom-go.mjs';

const hex = v => typeof v === 'number' ? v.toString(16) : parseInt(v, 16);
const go = new Go({debug: true});

go.exportFunction('main.sum', (sp, reader) => {
  reader.skipHeader();
  const [a1, a2] = reader.popTimes(Types.Int, 2)
  const result = a1 + a2;

  reader
    .writer()
    .write(Types.Int, result);

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
