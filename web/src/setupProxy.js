/**
 * Proxy config for create-react-app.
 *
 * See: https://create-react-app.dev/docs/proxying-api-requests-in-development/
 */

const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');
const fs = require('fs').promises;

// See: Makefile
const PROXY_HOST = process.env.LISTEN_ADDR || '127.0.0.1:8000';

/**
 * Append x-payload-content-length header to a response.
 *
 * Used to provide download progress for WASM binaries.
 *
 * Built-in Express server transfers data in chunks and doesn't provide
 * Content-Length header.
 *
 * @see web/src/services/gorepl/worker/worker.ts
 *
 * @param req
 * @param res
 * @param next
 */
const appendWasmContentLength = async (req, res, next) => {
  try {
    const filePath = path.join(process.cwd(), 'public', req.path);
    const {size} = await fs.stat(filePath);
    res.setHeader('x-payload-content-length', size);
  } catch (_) {
    // Suppress errors
  } finally {
    next();
  }
}

module.exports = function(app) {
  app.use((req, res, next) => {
    if (!req.url.endsWith('.wasm')) {
      next();
      return;
    }

    appendWasmContentLength(req, res, next).catch(err => {});
  });

  app.use(
    '/api',
    createProxyMiddleware({
      target: `http://${PROXY_HOST}`,
      changeOrigin: true,
    })
  );
};
