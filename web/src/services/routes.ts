const snippetRegex = /\/snippet\/([A-Za-z0-9]+)$/;

export function getSnippetID(): string | null {
    const matches = snippetRegex.exec(window.location.pathname);
    if (!matches || !matches[1]) {
        return null;
    }

    return matches[1];
}