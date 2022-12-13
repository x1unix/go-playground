// WebCrypto API is available only in Node.js v19+
const { Crypto } = require("@peculiar/webcrypto");

if (!global.crypto) {
  global.crypto = new Crypto();
}
