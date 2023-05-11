import * as axios from 'axios';
import { languages } from "monaco-editor";
import {
  Backend,
  VersionResponse,
  RunResponse,
  BuildResponse,
  Snippet,
  ShareResponse, VersionsInfo
} from "./models";
import { IAPIClient } from "./interface";

export class Client implements IAPIClient {
  private readonly client: axios.AxiosInstance;

  get axiosClient() {
    return this.client;
  }

  constructor(private baseUrl: string) {
    this.client = axios.default.create({ baseURL: baseUrl });
  }

  async getVersion(): Promise<VersionResponse> {
    return this.get<VersionResponse>(`/version?=${Date.now()}`)
  }

  async getSuggestions(query: { packageName?: string, value?: string }): Promise<languages.CompletionList> {
    const queryParams = Object.keys(query).map(k => `${k}=${query[k]}`).join('&');
    return this.get<languages.CompletionList>(`/suggest?${queryParams}`);
  }

  async build(code: string, format: boolean): Promise<BuildResponse> {
    return this.post<BuildResponse>(`/compile?format=${Boolean(format)}`, code);
  }

  async getArtifact(fileName: string): Promise<Response> {
    const resp = await fetch(`${this.baseUrl}/artifacts/${fileName}`);
    if (resp.status >= 400) {
      const err = await resp.json();
      throw new Error(err.message ?? resp.statusText);
    }

    return resp;
  }

  async evaluateCode(code: string, format: boolean, backend = Backend.Default): Promise<RunResponse> {
    return this.post<RunResponse>(`/run?format=${Boolean(format)}&backend=${backend}`, code);
  }

  async formatCode(code: string, backend = Backend.Default): Promise<RunResponse> {
    return this.post<RunResponse>(`/format?backend=${backend}`, code);
  }

  async getSnippet(id: string): Promise<Snippet> {
    return this.get<Snippet>(`/snippet/${id}`);
  }

  async shareSnippet(code: string): Promise<ShareResponse> {
    return this.post<ShareResponse>('/share', code);
  }

  async getBackendVersions(): Promise<VersionsInfo> {
    return this.get<VersionsInfo>('/backends/info');
  }

  private async get<T>(uri: string): Promise<T> {
    try {
      const resp = await this.client.get<T>(uri);
      return resp.data;
    } catch (err) {
      throw Client.extractAPIError(err);
    }
  }

  private async post<T>(uri: string, data: any, cfg?: axios.AxiosRequestConfig): Promise<T> {
    try {
      const resp = await this.client.post<T>(uri, data, cfg);
      return resp.data;
    } catch (err) {
      throw Client.extractAPIError(err);
    }
  }

  private static extractAPIError(err: any): Error {
    return new Error(err?.response?.data?.error ?? err.message);
  }
}
