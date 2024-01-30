import { resolve } from 'path'
import react from '@vitejs/plugin-react-swc'
import { defineConfig } from 'vite'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import svgr from 'vite-plugin-svgr'
import tsConfigPaths from 'vite-tsconfig-paths'
import htmlTemplate from 'vite-plugin-html-template'

const {
  NODE_ENV = 'dev',
  VITE_WASM_BASE_URL = '/wasm/',
  VITE_WASM_API_VER = 'v2',
  VITE_BASE_URL = '/',
} = process.env

const PROXY_HOST = process.env.LISTEN_ADDR || '127.0.0.1:8000';

export default defineConfig({
  resolve: {
    alias: {
      '~': resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': PROXY_HOST,
    }
  },
  build: {
    outDir: 'build',
  },
  plugins: [
    react(),
    tsConfigPaths(),
    htmlTemplate({
      data: {
        PROD: NODE_ENV === 'production',
        VITE_WASM_BASE_URL,
        VITE_WASM_API_VER,
        VITE_BASE_URL,
      }
    }),
    svgr({ svgrOptions: { icon: true } }),
    nodePolyfills({
      globals: {
        Buffer: true,
        process: true,
      },
    }),
  ],
})
