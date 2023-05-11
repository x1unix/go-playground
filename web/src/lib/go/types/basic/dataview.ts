import { AbstractTypeSpec } from "~/lib/go/types/spec";

interface DataViewReader<T=number> {
  call(thisArg: DataView, address: number, leftEndian?: boolean): T
}

interface DataViewWriter<T=number> {
  call(thisArg: DataView, address: number, value: T, leftEndian?: boolean): T
}

export interface DataViewDescriptor<T=number> {
  read: DataViewReader<T>
  write: DataViewWriter<T>
}

/**
 * DataViewableTypeSpec is a type wrapper for numeric values that can be read
 * using raw DataView methods.
 */
export class DataViewableTypeSpec<T=number|bigint> extends AbstractTypeSpec<T> {
  _readMethod: DataViewReader<T>;
  _writeMethod: DataViewWriter<T>;

  constructor(name, size: number, align: number, skip: number, rwObj: DataViewDescriptor<T>) {
    super(name, size, align, skip);
    this._readMethod = rwObj.read;
    this._writeMethod = rwObj.write;
  }

  decode(view, addr): T {
    return this._readMethod.call(view, addr, true);
  }

  encode(view, addr, data) {
    this._writeMethod.call(view, addr, data, true);
  }
}
