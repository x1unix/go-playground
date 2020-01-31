import { v4 as uuid } from 'uuid';
import * as monaco from 'monaco-editor';

const WORKER_PATH = '/worker.js';

enum MessageType {
    Exit = 'EXIT',
    Analyze = 'ANALYZE'
}

interface PromiseSubscription<T> {
    resolve: (result: T) => void
    reject: (err: any) => void
}

interface WorkerRequest<T> {
    id: string
    type: MessageType
    data: T
}

interface WorkerResponse<T> {
    id: string
    type: MessageType
    error?: string
    result?: T
}

export interface AnalyzeResult {
    hasErrors: boolean
    markers: monaco.editor.IMarkerData[]
}

export class Analyzer {
    private terminated = false;
    private worker: Worker;
    private subscriptions = new Map<string, PromiseSubscription<any>>();

    constructor() {
        this.worker = new Worker(WORKER_PATH);
        this.worker.onmessage = (m) => this.onMessage(m);
    }

    async analyzeCode(code: string) {
        return this.request<string, AnalyzeResult>(MessageType.Analyze, code);
    }

    dispose() {
        this.terminated = true;
        this.worker.postMessage({type: MessageType.Exit});
        setTimeout(() => {
            this.worker.terminate();
            this.cleanSubscriptions();
        }, 150);
    }

    private cleanSubscriptions() {
        this.subscriptions.forEach(val => val.reject('Analyzer is disposed'));
        this.subscriptions.clear();
    }

    private onMessage(e: MessageEvent) {
        if (this.terminated) {
            return;
        }

        let data = e.data as WorkerResponse<any>;
        const sub = this.subscriptions.get(data.id);
        if (!sub) {
            console.warn('analyzer: orphan worker event "%s"', data.id);
            return;
        }

        let { resolve, reject } = sub;
        this.subscriptions.delete(data.id);
        if (data.error) {
            reject(data.error);
            return
        }

        resolve(data.result);
    }

    private async request<I,O>(type: MessageType, data: I): Promise<O> {
        if (this.terminated) {
            throw new Error('Analyzer is disposed');
        }

        return new Promise((resolve, reject) => {
            const id = uuid();
            this.subscriptions.set(id, {resolve, reject} as PromiseSubscription<O>);

            const msg = {id, type, data} as WorkerRequest<I>;
            this.worker.postMessage(msg);
        });
    }

    static supported() {
        return 'WebAssembly' in window;
    }
}