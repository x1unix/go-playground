import { type AxiosInstance } from 'axios'
import { type languages } from 'monaco-editor'
import {
  type VersionResponse,
  type RunResponse,
  type BuildResponse,
  type ShareResponse,
  type VersionsInfo,
  type FilesPayload,
} from './models'

export interface IAPIClient {
  readonly axiosClient: AxiosInstance

  getVersion: () => Promise<VersionResponse>

  getSuggestions: (query: { packageName?: string; value?: string }) => Promise<languages.CompletionList>

  run: (files: Record<string, string>, vet: boolean) => Promise<RunResponse>

  format: (files: Record<string, string>) => Promise<FilesPayload>

  build: (files: Record<string, string>) => Promise<BuildResponse>

  getArtifact: (fileName: string) => Promise<Response>

  getSnippet: (id: string) => Promise<FilesPayload>

  shareSnippet: (files: Record<string, string>) => Promise<ShareResponse>

  getBackendVersions: () => Promise<VersionsInfo>
}
