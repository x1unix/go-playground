import { UintPtr, Int } from '../basic';
import { StructTypeSpec } from '../complex';

const encoder = new TextDecoder('utf-8');
const decoder = new TextDecoder('utf-8');

const stringStructDescriptor = [
  { key: 'data', type: UintPtr },
  { key: 'len', type: Int}
];

export interface StringHeader {
  data: number,
  len: number
}

class GoStringTypeSpec extends StructTypeSpec<StringHeader> {
  constructor() {
    super('string', stringStructDescriptor);
  }

  protected valueFromStruct(mem: ArrayBufferLike, structVal: StringHeader) {
    const { data, len } = structVal;
    return decoder.decode(new DataView(mem, data, len));
  }
}

export const GoStringType = new GoStringTypeSpec();
export const StringHeaderType = new StructTypeSpec(
  'reflect.StringHeader', stringStructDescriptor
);

