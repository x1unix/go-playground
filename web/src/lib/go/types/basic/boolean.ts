import { AbstractTypeSpec } from "~/lib/go/types/spec";

export class BooleanTypeSpec extends AbstractTypeSpec {
  constructor() {
    super('bool', 1, 1, 0);
  }

  decode(view, addr) {
    const val = view.getUint8(addr);
    return !!val;
  }

  encode(view, addr, data) {
    view.setUint8(addr, +data);
  }
}
