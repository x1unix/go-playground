import * as axios from 'axios';
import {AxiosInstance} from "axios";
import * as monaco from "monaco-editor";

const apiAddress = process.env['REACT_APP_LANG_SERVER'] ?? window.location.origin;

let axiosClient = axios.default.create({baseURL: `${apiAddress}/api`});

export interface Snippet {
    fileName: string
    code: string
}

export interface EvalEvent {
    Message: string
    Kind: string
    Delay: number
}

export interface CompilerResponse {
    formatted?: string|null
    events: EvalEvent[]
}

export interface IAPIClient {
    readonly axiosClient: AxiosInstance
    getSuggestions(query: {packageName?: string, value?:string}): Promise<monaco.languages.CompletionList>
    evaluateCode(code: string): Promise<CompilerResponse>
    formatCode(code: string): Promise<CompilerResponse>
    getSnippet(id: string): Promise<Snippet>
}

class Client implements IAPIClient {
    get axiosClient() {
        return this.client;
    }

    constructor(private client: axios.AxiosInstance) {}

    async getSuggestions(query: {packageName?: string, value?:string}): Promise<monaco.languages.CompletionList> {
        const queryParams = Object.keys(query).map(k => `${k}=${query[k]}`).join('&');
        return this.get<monaco.languages.CompletionList>(`/suggest?${queryParams}`);
    }

    async evaluateCode(code: string): Promise<CompilerResponse> {
        return this.post<CompilerResponse>('/compile', code);
    }

    async formatCode(code: string): Promise<CompilerResponse> {
        return this.post<CompilerResponse>('/format', code);
    }

    async getSnippet(id: string): Promise<Snippet> {
        return this.get<Snippet>(`/snippet/${id}`);
    }

    private async get<T>(uri: string): Promise<T> {
        try {
            const resp = await this.client.get<T>(uri);
            return resp.data;
        } catch(err) {
            throw Client.extractAPIError(err);
        }
    }

    private async post<T>(uri: string, data: any): Promise<T> {
        try {
            const resp = await this.client.post<T>(uri, data);
            return resp.data;
        } catch(err) {
            throw Client.extractAPIError(err);
        }
    }

    private static extractAPIError(err: any): Error {
        return new Error(err?.response?.data?.error ?? err.message);
    }
}

export default new Client(axiosClient);
