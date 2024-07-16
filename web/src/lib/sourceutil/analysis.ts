const wasmBuildTagRegex = /^\/\/go:build\s(js|wasm)(\s(&&|\|\|)\s(js|wasm))?/

const isGoFile = (fileName: string) => fileName.endsWith('.go')

/**
 * Checks if Go program source files contain WebAssembly build constraints.
 *
 * For example: `//go:build wasm`
 */
export const requiresWasmEnvironment = (files: Record<string, string>): boolean =>
  Object.entries(files)
    .filter(([name]) => isGoFile(name))
    .some(([, src]) => src.match(wasmBuildTagRegex))
