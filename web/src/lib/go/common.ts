export const toHex = (v: number) => v.toString(16)
export const fromHex = (v: string) => parseInt(v, 16)

/**
 * Formats number to hex or parses number from hex string.
 * @param v
 */
export const hex = (v: number | bigint | string) => {
  switch (typeof v) {
    case 'number':
      return toHex(v)
    case 'bigint':
      return toHex(Number(v))
    case 'string':
      return fromHex(v)
    default:
      throw new Error(`hex: invalid argument type ${typeof v}`)
  }
}

export interface DebugOptions {
  debug?: boolean
}

export const validateResponse = async (resp: Response | PromiseLike<Response>) => {
  const r: Response = resp instanceof Promise ? await resp : resp
  if (r.status !== 200) {
    throw new Error(`Invalid HTTP response: '${r.status} ${r.statusText}' (URL: ${r.url})`)
  }
}

export const instantiateStreaming = async (resp: Response | PromiseLike<Response>, importObject) => {
  const r: Response = resp instanceof Promise ? await resp : resp
  if (r.status !== 200) {
    throw new Error(
      'Cannot instantiate WebAssembly streaming, invalid HTTP response: ' +
        `'${r.status} ${r.statusText}' (URL: ${r.url})`,
    )
  }

  if ('instantiateStreaming' in WebAssembly) {
    return await WebAssembly.instantiateStreaming(r, importObject)
  }

  const source = await r.arrayBuffer()
  return await WebAssembly.instantiate(source, importObject)
}
