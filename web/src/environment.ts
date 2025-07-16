/**
 * Global environment variables
 */

const environment = {
  appVersion: import.meta.env.VITE_VERSION ?? '1.0.0-snapshot',
  apiUrl: import.meta.env.VITE_LANG_SERVER ?? window.location.origin,

  go: {
    currentVersion: import.meta.env.VITE_GO_VERSION ?? '1.19',
    previousVersion: import.meta.env.VITE_PREV_GO_VERSION ?? '1.18',
  },

  urls: {
    github: import.meta.env.VITE_GITHUB_URL ?? 'https://github.com/x1unix/go-playground',
    issue: import.meta.env.VITE_GITHUB_URL ?? 'https://github.com/x1unix/go-playground/issues/new',
    donate: import.meta.env.VITE_DONATE_URL ?? 'https://opencollective.com/bttr-go-playground',
  },
}

export default environment
