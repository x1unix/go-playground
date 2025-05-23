export interface VersionResponse {
  version: string
}

export interface VersionsInfo {
  playground: {
    current: string
    goprev: string
    gotip: string
  }

  wasm: string
}
