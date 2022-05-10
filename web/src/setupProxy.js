/**
 * Proxy config for create-react-app.
 *
 * See: https://create-react-app.dev/docs/proxying-api-requests-in-development/
 */

const { createProxyMiddleware } = require('http-proxy-middleware');

// See: Makefile
const PROXY_HOST = process.env.LISTEN_ADDR || '127.0.0.1:8000';

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: `http://${PROXY_HOST}`,
      changeOrigin: true,
    })
  );
};
