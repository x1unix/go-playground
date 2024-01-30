/// <reference types="vite/client" />
/// <reference types="vite-plugin-svgr/client" />

interface ImportMetaEnv {
  readonly VITE_VERSION: string
  readonly VITE_LANG_SERVER: string
  readonly VITE_GO_VERSION: string
  readonly VITE_PREV_GO_VERSION: string
  readonly VITE_GITHUB_URL: string
  readonly VITE_DONATE_URL: string
  readonly BASE_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
