import {AxiosInstance} from "axios";
import { languages } from "monaco-editor";
import {
  VersionResponse,
  RunResponse,
  BuildResponse,
  Snippet,
  ShareResponse,
  VersionsInfo
} from "./models";

export interface IAPIClient {
  readonly axiosClient: AxiosInstance

  getVersion(): Promise<VersionResponse>

  getSuggestions(query: { packageName?: string, value?: string }): Promise<languages.CompletionList>

  evaluateCode(code: string, format: boolean): Promise<RunResponse>

  formatCode(code: string): Promise<RunResponse>

  build(code: string, format: boolean): Promise<BuildResponse>

  getArtifact(fileName: string): Promise<Response>

  getSnippet(id: string): Promise<Snippet>

  shareSnippet(code: string): Promise<ShareResponse>

  getBackendVersions(): Promise<VersionsInfo>
}
