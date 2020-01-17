const path = require('path');
const fs = require('fs');
const axios = require('axios');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;
const { GODOC_URL, parseGoDocPage } = require('./domCollector');
const { buildPackageTree } = require('./order');

const DEST_FILE = path.resolve(__dirname, '../../data/packages.json');

async function main() {
    console.log(`Downloading page from "%s"...`, GODOC_URL);
    let resp = await axios.get(GODOC_URL);

    console.log('Parsing page...');
    const dom = new JSDOM(resp.data);
    const packages = parseGoDocPage(dom.window.document);

    console.info('Found %d packages', packages.length);
    console.log('Building package tree...');
    const pkgTree = buildPackageTree(packages);

    console.log('Saving data...');
    fs.writeFileSync(DEST_FILE, JSON.stringify(pkgTree, null, '\t'));

    console.log('Data saved to "%s"', DEST_FILE);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});