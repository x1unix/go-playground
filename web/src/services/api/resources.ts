const {
  VITE_WASM_API_VER: wasmApiVersion = 'v1',
  VITE_WASM_BASE_URL: wasmBaseUrl = '/wasm',
} = import.meta.env;

/**
 * Formats and returns the URL for the WASM binary.
 *
 * @param name
 */
export const getWasmUrl = name => `${wasmBaseUrl}/${name}@${wasmApiVersion}.wasm`;

/**
 * URL for Go Wasm executor
 */
export const wasmExecUrl = `${wasmBaseUrl}/wasm_exec@${wasmApiVersion}.js`;
