import { type AxiosInstance } from 'axios'
import { type languages } from 'monaco-editor'
import {
  type VersionResponse,
  type RunResponse,
  type BuildResponse,
  type Snippet,
  type ShareResponse,
  type VersionsInfo,
  type FormatResponse,
} from './models'

export interface IAPIClient {
  readonly axiosClient: AxiosInstance

  getVersion: () => Promise<VersionResponse>

  getSuggestions: (query: { packageName?: string; value?: string }) => Promise<languages.CompletionList>

  run: (files: Record<string, string>, vet: boolean) => Promise<RunResponse>

  format: (files: Record<string, string>) => Promise<FormatResponse>

  build: (code: string, format: boolean) => Promise<BuildResponse>

  getArtifact: (fileName: string) => Promise<Response>

  getSnippet: (id: string) => Promise<Snippet>

  shareSnippet: (code: string) => Promise<ShareResponse>

  getBackendVersions: () => Promise<VersionsInfo>
}
