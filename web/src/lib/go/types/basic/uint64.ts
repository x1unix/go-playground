import { AbstractTypeSpec } from "~/lib/go/types/spec";

const MAX_INT32 = 4294967296;

export class UInt64TypeSpec extends AbstractTypeSpec<boolean> {
  constructor(name) {
    super(name, 8, 8, 0);
  }

  decode(view, addr) {
    const low = view.getUint32(addr, true);
    const high = view.getInt32(addr + 4, true);

    return low + high * MAX_INT32;
  }

  encode(view, addr, val) {
    view.setUint32(addr, val, true);
    view.setUint32(addr + 4, Math.floor(val / MAX_INT32), true);
  }
}

export class Int64TypeSpec extends AbstractTypeSpec<number> {
  constructor(name) {
    super(name, 8, 8, 0);
  }

  decode(view, addr) {
    const low = view.getUint32(addr, true);
    const high = view.getInt32(addr + 4, true);

    return low + high * MAX_INT32;
  }

  encode(view, addr, val) {
    view.setUint32(addr, val, true);
    view.setUint32(addr + 4, Math.floor(val / MAX_INT32), true);
  }
}
