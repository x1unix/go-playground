// Parses list of built-in Go packages from https://golang.org/pkg/

const GODOC_URL = 'https://golang.org/pkg';

const parseRowMetadata = row => {
    if (!row) {
        return null;
    }

    const tr = row.querySelector('.pkg-name');
    const name = tr.textContent.trim();
    const path = tr.querySelector('a').href.slice(0, -1);   // Trim "/" suffix
    const url = `${GODOC_URL}/${path}/`;
    let synopsis = row.querySelector('.pkg-synopsis').textContent.trim();

    // Add GoDoc link
    synopsis += `\n\n["${path}" on godoc.org](${url})`;

    // sub-packages have "padding-left: Npx" style attribute
    const depth = parseInt(tr.style.paddingLeft, 10);

    return {
        name,
        synopsis,
        url,
        path,
        depth,
        children: [],
    };
};

const collectAllPackages = pkgDir => {
    // First row is reserved as header, so we need to start from second row.
    // P.S - looks like that Go dev guys don't know that <thead> exists.
    let row = pkgDir.querySelector('tbody tr:first-child');
    const results = [];
    while ((row = row.nextElementSibling) !== null) {
        let def = parseRowMetadata(row);
        results.push(def);
    }

    return results;
};

const parseDepth = (parent, start, items) => {
    let i = start;
    while (i < items.length) {
        let item = items[i];
        if (item.depth <= parent.depth) {
            break;
        }

        parent.children.push(item);
        i = parseDepth(item, i + 1, items);
    }

    return i;
};

module.exports = {
    GODOC_URL,
    parseGoDocPage: (document) => {
        const pkgDir = document.querySelector('.pkg-dir');
        return collectAllPackages(pkgDir);
    }
};
