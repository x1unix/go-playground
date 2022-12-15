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

go.exportFunction('main.testInt2', (sp, reader) => {
  reader.skipHeader();
  const v1 = reader.pop(Types.Int);
  const v2 = reader.pop(Types.Int);
  console.log([v1, v2]);
  console.log(go.inspector.dump(sp, 48, 16));
})

go.exportFunction('main.testBoolInt32', sp => {
  const val0 = go.mem.getUint8(sp + 4);
  const val1 = go.mem.getUint32(sp + 4);
  console.log('main.testBoolInt32', {
    v0: {
      v: val0,
      addr: (sp + 4).toString(16),
    },
    v1: {
      v: val1,
      addr: (sp + 4).toString(16)
    }
  })
  console.log(go.inspector.dump(sp, 32, 16));
})

go.exportFunction('main.testBoolU8', sp => {
  const val0 = go.mem.getUint8(sp + 1);
  const val1 = go.mem.getUint8(sp + 2);
  console.log('main.testBoolInt32', {
    v0: {
      v: val0,
      addr: (sp + 4).toString(16),
    },
    v1: {
      v: val1,
      addr: (sp + 4).toString(16)
    }
  })
  console.log(go.inspector.dump(sp, 48, 16));
})

go.exportFunction('main.testBool', (sp, reader) => {
  reader.skipHeader();
  const v0 = reader.pop(Types.Boolean);
  const v1 = reader.pop(Types.Boolean);
  const v2 = reader.pop(Types.Boolean);
  console.log([v0, v1, v2]);
  console.log(go.inspector.dump(sp, 32, 16));
})

go.exportFunction('main.testU8', (sp, reader) => {
  reader.skipHeader();
  const v1 = reader.pop(Types.Byte);
  const v2 = reader.pop(Types.Byte);
  const v3 = reader.pop(Types.Byte);
  console.log([v1, v2, v3]);

  console.log(go.inspector.dump(sp, 32, 16));
})

go.exportFunction('main.testU32', (sp, reader) => {
  reader.skipHeader();
  const [v1, v2, v3] = reader.popTimes(Types.Uint32, 3);
  console.log([v1, v2, v3]);
  console.log(go.inspector.dump(sp, 32, 16));
})

go.exportFunction('main.testI32', (sp, reader) => {
  reader.skipHeader();
  const [v1, v2, v3] = reader.popTimes(Types.Int32, 3);
  console.log([v1, v2, v3]);
  console.log(go.inspector.dump(sp, 32, 16));
})

go.exportFunction('main.testU64', (sp, reader) => {
  reader.skipHeader();
  const [v1, v2, v3] = reader.popTimes(Types.Uint64, 3);
  console.log([v1, v2, v3]);
  console.log(go.inspector.dump(sp, 32, 16));
});

go.exportFunction('main.testI64', (sp, reader) => {
  reader.skipHeader();
  const [v1, v2, v3] = reader.popTimes(Types.Int64, 3);
  console.log([v1, v2, v3]);
  console.log(go.inspector.dump(sp, 32, 16));
})

go.exportFunction('main.testF32', (sp, reader) => {
  reader.skipHeader();
  const [v1, v2, v3] = reader.popTimes(Types.Float32, 3);
  console.log([v1, v2, v3]);
  console.log(go.inspector.dump(sp, 32, 16));
});

go.exportFunction('main.testF64', (sp, reader) => {
  reader.skipHeader();
  const [v1, v2, v3] = reader.popTimes(Types.Float64, 3);
  console.log([v1, v2, v3]);
  console.log(go.inspector.dump(sp, 32, 16));
});

go.exportFunction('main.testBool_U32', (sp, reader) => {
  reader.skipHeader();
  const v1 = reader.pop(Types.Boolean);
  const v2 = reader.pop(Types.Uint32);
  console.log([v1, v2]);
  console.log(go.inspector.dump(sp, 32, 16));
})

go.exportFunction('main.testU8_U32_U8', (sp, reader) => {
  reader.skipHeader();
  const v1 = reader.pop(Types.Uint8);
  const v2 = reader.pop(Types.Uint32);
  const v3 = reader.pop(Types.Uint8);
  console.log([v1, v2, v3]);
  console.log(go.inspector.dump(sp, 32, 16));
})

go.exportFunction('main.testBool_UintPtr2', (sp, reader) => {
  reader.skipHeader();
  const v1 = reader.pop(Types.Boolean);
  const v2 = reader.pop(Types.UintPtr);
  const v3 = reader.pop(Types.UintPtr);
  console.log([v1, v2, v3])
  console.log(go.inspector.dump(sp, 32, 16));
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
