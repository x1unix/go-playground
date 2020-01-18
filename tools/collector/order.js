const compactNodes = (parent, start, items) => {
    let i = start;
    while (i < items.length) {
        let item = items[i];
        if (item.depth <= parent.depth) {
            break;
        }

        parent.children.push(item);
        i = compactNodes(item, i + 1, items);
    }

    return i;
};

exports.buildPackageTree = pkgs => {
    const ordered = [];
    compactNodes({name: '', children: ordered, depth: -1}, 0, pkgs);
    return ordered;
};
