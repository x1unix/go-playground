const {
  REACT_APP_WASM_API_VERSION: wasmApiVersion = 'v1',
  REACT_APP_WASM_BASE_URL: wasmBaseUrl = '',
} = process.env;

/**
 * Formats and returns the URL for the WASM binary.
 *
 * @param name
 */
export const getWasmUrl = name => `${wasmBaseUrl}/${name}@${wasmApiVersion}.wasm`;
