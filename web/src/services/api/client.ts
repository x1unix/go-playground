import {
  Backend,
  type VersionResponse,
  type RunResponse,
  type BuildResponse,
  type ShareResponse,
  type VersionsInfo,
  type FilesPayload,
} from './models'
import type { IAPIClient } from './interface'

export class Client implements IAPIClient {
  constructor(private readonly baseUrl: string) {}

  async getVersion(): Promise<VersionResponse> {
    return await this.get<VersionResponse>(`/version?=${Date.now()}`)
  }

  async build(files: Record<string, string>): Promise<BuildResponse> {
    return await this.post<BuildResponse>(`/v2/compile`, { files })
  }

  async getArtifact(fileName: string): Promise<Response> {
    const resp = await fetch(`${this.baseUrl}/artifacts/${fileName}`)
    if (resp.status >= 400) {
      const err = await resp.json()
      throw new Error(err.message ?? resp.statusText)
    }

    return resp
  }

  async run(files: Record<string, string>, vet: boolean, backend = Backend.Default): Promise<RunResponse> {
    return await this.post<RunResponse>(`/v2/run?vet=${Boolean(vet)}&backend=${backend}`, { files })
  }

  async format(files: Record<string, string>, backend = Backend.Default): Promise<FilesPayload> {
    return await this.post<FilesPayload>(`/v2/format?backend=${backend}`, { files })
  }

  async getSnippet(id: string): Promise<FilesPayload> {
    return await this.get<FilesPayload>(`/v2/share/${id}`)
  }

  async shareSnippet(files: Record<string, string>): Promise<ShareResponse> {
    return await this.post<ShareResponse>('/v2/share', { files })
  }

  async getBackendVersions(): Promise<VersionsInfo> {
    return await this.get<VersionsInfo>('/backends/info')
  }

  private async get<T>(uri: string): Promise<T> {
    return await this.doRequest<T>(uri, {
      headers: {
        Accept: 'application/json',
      },
    })
  }

  private async post<T>(uri: string, data: any): Promise<T> {
    return await this.doRequest(uri, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
  }

  private async doRequest<T>(uri: string, reqInit?: RequestInit): Promise<T> {
    const reqUrl = this.baseUrl + uri
    const rsp = await fetch(reqUrl, reqInit)
    if (rsp.ok) {
      return (await rsp.json()) as T
    }

    const isJson = rsp.headers.get('content-type')
    if (!isJson) {
      throw new Error(`${rsp.status} ${rsp.statusText}`)
    }

    let errBody: { error: string }
    try {
      errBody = await rsp.json()
    } catch (_) {
      // Fallback in case of malformed response
      errBody = {
        error: `${rsp.status} ${rsp.statusText}`,
      }
    }

    throw new Error(errBody.error)
  }
}
