import {
  Backend,
  type AnnouncementMessageResponse,
  type AnnouncementMessage,
  type VersionResponse,
  type RunResponse,
  type BuildResponse,
  type ShareResponse,
  type VersionsInfo,
  type FilesPayload,
  CFError,
} from './models'
import type { IAPIClient } from './interface'

export interface RequestOpts {
  turnstileToken?: string
}

export class Client implements IAPIClient {
  constructor(private readonly baseUrl: string) {
    // Empty comment to workaroud prettier formatting issues.
  }

  /**
   * Returns server API version.
   */
  async getVersion(): Promise<VersionResponse> {
    return await this.get<VersionResponse>(`/version?=${Date.now()}`)
  }

  /**
   * Build WebAssembly Go program using files.
   *
   * WASM file can be downloaded using {@link getArtifact} call.
   */
  async build(files: Record<string, string>, opts?: RequestOpts): Promise<BuildResponse> {
    return await this.post<BuildResponse>(`/v2/compile`, { files }, opts)
  }

  /**
   * Returns WebAssembly program compiled using {@link build} call.
   */
  async getArtifact(fileName: string): Promise<Response> {
    const resp = await fetch(`${this.baseUrl}/artifacts/${fileName}`)
    if (resp.status >= 400) {
      const err = await resp.json()
      throw new Error(err.message ?? resp.statusText)
    }

    return resp
  }

  /**
   * Runs a program on server and returns execution result.
   *
   * @param files List of Go files.
   * @param vet Determines whether "go vet" should be executed.
   * @param backend Go server backend to use.
   * @returns
   */
  async run(
    files: Record<string, string>,
    vet: boolean,
    backend = Backend.Default,
    opts?: RequestOpts,
  ): Promise<RunResponse> {
    return await this.post<RunResponse>(`/v2/run?vet=${Boolean(vet)}&backend=${backend}`, { files }, opts)
  }

  /**
   * Formats Go files.
   */
  async format(files: Record<string, string>, backend = Backend.Default, opts?: RequestOpts): Promise<FilesPayload> {
    return await this.post<FilesPayload>(`/v2/format?backend=${backend}`, { files }, opts)
  }

  /**
   * Returns contents of a snippet shared using {@link shareSnippet}.
   */
  async getSnippet(id: string): Promise<FilesPayload> {
    return await this.get<FilesPayload>(`/v2/share/${id}`)
  }

  /**
   * Uploads a snippet and returns share URL link.
   */
  async shareSnippet(files: Record<string, string>, opts?: RequestOpts): Promise<ShareResponse> {
    return await this.post<ShareResponse>('/v2/share', { files }, opts)
  }

  /**
   * Returns list of Go versions used to build or run programs on server.
   */
  async getBackendVersions(): Promise<VersionsInfo> {
    return await this.get<VersionsInfo>('/backends/info')
  }

  /**
   * Returns important announcement message to be displayed at header banner.
   */
  async getAnnouncementMessage(): Promise<AnnouncementMessage | null> {
    const { message } = await this.get<AnnouncementMessageResponse>('/announcement')
    return message
  }

  private async get<T>(uri: string): Promise<T> {
    return await this.doRequest<T>(uri, {
      headers: {
        Accept: 'application/json',
      },
    })
  }

  private async post<T>(uri: string, data: any, opts?: RequestOpts): Promise<T> {
    const body: RequestInit = {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    }

    if (opts?.turnstileToken?.length) {
      if (!body.headers) {
        body.headers = {}
      }

      body.headers['X-Cf-Turnstile-Response'] = opts.turnstileToken
    }

    return await this.doRequest(uri, body)
  }

  private async doRequest<T>(uri: string, reqInit?: RequestInit): Promise<T> {
    const reqUrl = this.baseUrl + uri
    const rsp = await fetch(reqUrl, reqInit)
    if (rsp.ok) {
      return (await rsp.json()) as T
    }

    const cfMitigated = rsp.headers.get('cf-mitigated')
    if (cfMitigated && cfMitigated === 'challenge') {
      throw new CFError(cfMitigated)
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
