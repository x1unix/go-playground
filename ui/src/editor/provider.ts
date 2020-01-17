import * as monaco from 'monaco-editor';
import * as axios from 'axios';

// Import aliases
type CompletionList = monaco.languages.CompletionList;
type CompletionContext = monaco.languages.CompletionContext;
type ITextModel = monaco.editor.ITextModel;
type Position = monaco.Position;
type CancellationToken = monaco.CancellationToken;

let alreadyRegistered = false;

// Matches package (and method name)
const COMPL_REGEXP = /([a-zA-Z0-9_]+)(\.([A-Za-z0-9_]+))?$/;
const R_GROUP_PKG = 1;
const R_GROUP_METHOD = 3;

class GoCompletionItemProvider implements monaco.languages.CompletionItemProvider {
    constructor(private serverAddress: string) {}

    private parseExpression(expr: string) {
        COMPL_REGEXP.lastIndex = 0; // Reset regex state
        const m = COMPL_REGEXP.exec(expr);
        if (!m) {
            return null;
        }

        const varName = m[R_GROUP_PKG];
        const propValue = m[R_GROUP_METHOD];

        if (!propValue) {
            return {value: varName};
        }

        return {
            packageName: varName,
            value: propValue
        };
    }

    async provideCompletionItems(model: ITextModel, position: Position, context: CompletionContext, token: CancellationToken): Promise<CompletionList> {
        const val = model.getValueInRange({
            startLineNumber: position.lineNumber,
            startColumn: 0,
            endLineNumber: position.lineNumber,
            endColumn: position.column,
        }).trim();

        const query = this.parseExpression(val);
        if (!query) {
            return Promise.resolve({suggestions: []});
        }

        try {
            const queryParams = Object.keys(query).map(k => `${k}=${query[k]}`).join('&');
            const resp = await axios.default.get<CompletionList>(`/suggest?${queryParams}`, {
                baseURL: this.serverAddress
            });

            return Promise.resolve(resp.data);
        } catch (err) {
            console.error(`Failed to get code completion from server: ${err?.response?.data?.error ?? err.message}`);
            return Promise.resolve({suggestions: []});
        }
    }
}

export const registerGoLanguageProvider = (serverAddress: string) => {
    if (alreadyRegistered) {
        console.warn('Go Language provider was already registered');
        return;
    }

    alreadyRegistered = true;
    return monaco.languages.registerCompletionItemProvider('go', new GoCompletionItemProvider(serverAddress));
};
