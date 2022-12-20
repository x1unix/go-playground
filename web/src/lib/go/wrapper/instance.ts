/**
 * Go WebAssembly Instance
 */
export interface GoWebAssemblyInstance extends WebAssembly.Instance {
  exports: {
    mem: WebAssembly.Memory
    getsp(): number
    resume()
    run(argc: number, argv: number)
  }
}

type WebAssemblyInstanceExport = {[k in keyof GoWebAssemblyInstance['exports']]?: (...args) => void};

/**
 * Wrap Go's WebAssembly instance with hooks to intercept module export function calls.
 *
 * @param instance WebAssembly instance
 * @param hooks Key-value pair of export name and hook function
 */
export const wrapWebAssemblyInstance = (instance: GoWebAssemblyInstance, hooks: WebAssemblyInstanceExport = {}): GoWebAssemblyInstance => {
  const wrappedExports = Object.fromEntries(
    Object.entries(instance.exports)
      .filter(([key, val]) => typeof val === 'function' && key in hooks)
      .map(([key, val]) => [
        key,
        (...args) => {
          hooks[key](args)
          return (val as Function).apply(instance.exports, args)
        }
      ])
  );

  const WrappedWebAssemblyInstance = class implements GoWebAssemblyInstance {
    exports = {
      ...instance.exports,
      ...wrappedExports
    }
  };

  Object.setPrototypeOf(WrappedWebAssemblyInstance, instance);
  let inst = new WrappedWebAssemblyInstance();
  inst = Object.setPrototypeOf(inst, instance);
  return inst;
}
