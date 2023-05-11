
export const instantiateStreaming = async (resp, importObject) => {
  if ('instantiateStreaming' in WebAssembly) {
    return await WebAssembly.instantiateStreaming(resp, importObject);
  }

  const source = await (await resp).arrayBuffer();
  return await WebAssembly.instantiate(source, importObject);
};
