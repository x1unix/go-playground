import { CallImportHandler, GoWrapper } from '~/lib/go/wrapper/wrapper';

const goExportMetadataKey = Symbol('@GoExportMetadata');

/**
 * Base class for all classes who export methods to Go.
 */
export class PackageBinding {
  private static [goExportMetadataKey]?: GoExportMetadata
}

interface GoExportMetadata {
  packageName: string
  symbols: [string, CallImportHandler][]
}

const defineExportMetadata = (target: any, meta: GoExportMetadata) => {
  Object.defineProperty(
    target,
    goExportMetadataKey,
    {
      configurable: false,
      enumerable: false,
      writable: false,
      value: meta
    }
  );
}

const getGoExportMetadata = (target): GoExportMetadata|undefined => {
  return target[goExportMetadataKey];
}

/**
 * Package decorator adds base package name for all exported class methods.
 * @param pkgName Go package name
 * @constructor
 */
export const Package = (pkgName: string): ClassDecorator => (
  (constructor: Function) => {
    let meta = getGoExportMetadata(constructor.prototype);
    if (meta) {
      meta.packageName = pkgName;
      return;
    }

    defineExportMetadata(constructor.prototype, {
      packageName: pkgName,
      symbols: []
    });
  }
)

/**
 * WasmExport decorator adds class method to exports with given symbol name.
 * @param funcName Go function name to be linked with.
 * @constructor
 */
export const WasmExport = (funcName: string): MethodDecorator => (
  (target, propertyKey, descriptor) => {
    const func = (descriptor.value! as unknown) as CallImportHandler;
    const meta = getGoExportMetadata(target);

    if (meta) {
      meta.symbols.push([
        funcName, func
      ]);
      return;
    }

    defineExportMetadata(target, {
      packageName: '',
      symbols: [[funcName, func]]
    });
  }
);

/**
 * Adds exports to Go from given class instance.
 *
 * @param go Go wrapper instance
 * @param srcObj instance
 */
export const registerExportObject = (go: GoWrapper, srcObj: PackageBinding) => {
  const meta = getGoExportMetadata(srcObj);
  if (!meta) {
    throw new Error(
      `Go export metadata is missing.`
    );
  }

  const { packageName, symbols } = meta;
  for (const [funcName, func] of symbols) {
    go.exportFunction(`${packageName}.${funcName}`, (sp, reader, mem) => (
      func.call(srcObj, sp, reader, mem)
    ));
  }
}
