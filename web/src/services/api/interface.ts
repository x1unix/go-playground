import type { VersionResponse, RunResponse, BuildResponse, ShareResponse, VersionsInfo, FilesPayload } from './models'

export interface IAPIClient {
  getVersion: () => Promise<VersionResponse>

  run: (files: Record<string, string>, vet: boolean) => Promise<RunResponse>

  format: (files: Record<string, string>) => Promise<FilesPayload>

  build: (files: Record<string, string>) => Promise<BuildResponse>

  getArtifact: (fileName: string) => Promise<Response>

  getSnippet: (id: string) => Promise<FilesPayload>

  shareSnippet: (files: Record<string, string>) => Promise<ShareResponse>

  getBackendVersions: () => Promise<VersionsInfo>
}
