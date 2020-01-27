import * as axios from 'axios';
import {AxiosInstance} from 'axios';
import * as monaco from "monaco-editor";
import config from './config';

const apiAddress = `${config.serverUrl}/api`;
const axiosClient = axios.default.create({baseURL: apiAddress});

export enum EvalEventKind {
    Stdout = 'stdout',
    Stderr = 'stderr'
}

export interface ShareResponse {
    snippetID: string
}

export interface Snippet {
    fileName: string
    code: string
}

export interface EvalEvent {
    Message: string
    Kind: EvalEventKind
    Delay: number
}

export interface RunResponse {
    formatted?: string | null
    events: EvalEvent[]
}

export interface BuildResponse {
    formatted?: string | null
    fileName: string
}

export interface IAPIClient {
    readonly axiosClient: AxiosInstance

    getSuggestions(query: { packageName?: string, value?: string }): Promise<monaco.languages.CompletionList>

    evaluateCode(code: string, format: boolean): Promise<RunResponse>

    formatCode(code: string): Promise<RunResponse>

    build(code: string, format: boolean): Promise<BuildResponse>

    getArtifact(fileName: string): Promise<Response>

    getSnippet(id: string): Promise<Snippet>

    shareSnippet(code: string): Promise<ShareResponse>
}

export const instantiateStreaming = async (resp, importObject) => {
    if ('instantiateStreaming' in WebAssembly) {
        return await WebAssembly.instantiateStreaming(resp, importObject);
    }

    const source = await (await resp).arrayBuffer();
    return await WebAssembly.instantiate(source, importObject);
};

class Client implements IAPIClient {
    get axiosClient() {
        return this.client;
    }

    constructor(private client: axios.AxiosInstance) {
    }

    async getSuggestions(query: { packageName?: string, value?: string }): Promise<monaco.languages.CompletionList> {
        const queryParams = Object.keys(query).map(k => `${k}=${query[k]}`).join('&');
        return this.get<monaco.languages.CompletionList>(`/suggest?${queryParams}`);
    }

    async build(code: string, format: boolean): Promise<BuildResponse> {
        return this.post<BuildResponse>(`/compile?format=${Boolean(format)}`, code);
    }

    async getArtifact(fileName: string): Promise<Response> {
        const resp = await fetch(`${apiAddress}/artifacts/${fileName}`);
        if (resp.status >= 300) {
            const err = await resp.json();
            throw new Error(err.message ?? resp.statusText);
        }

        return resp;
    }

    async evaluateCode(code: string, format: boolean): Promise<RunResponse> {
        return this.post<RunResponse>(`/run?format=${Boolean(format)}`, code);
    }

    async formatCode(code: string): Promise<RunResponse> {
        return this.post<RunResponse>('/format', code);
    }

    async getSnippet(id: string): Promise<Snippet> {
        return this.get<Snippet>(`/snippet/${id}`);
    }

    async shareSnippet(code: string): Promise<ShareResponse> {
        return this.post<ShareResponse>('/share', code);
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

export default new Client(axiosClient);
