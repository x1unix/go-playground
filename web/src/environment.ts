/**
 * Global environment variables
 */
const environment = {
  appVersion: process.env.REACT_APP_VERSION ?? '1.0.0-snapshot',
  apiUrl: process.env.REACT_APP_LANG_SERVER ?? window.location.origin,

  go: {
    currentVersion: process.env.REACT_APP_GO_VERSION ?? '1.19',
    previousVersion: process.env.REACT_APP_PREV_GO_VERSION ?? '1.18',
  },

  urls: {
    github: process.env.REACT_APP_GITHUB_URL ?? 'https://github.com/x1unix/go-playground',
    issue: process.env.REACT_APP_GITHUB_URL ?? 'https://github.com/x1unix/go-playground/issues/new',
    donate: process.env.REACT_APP_DONATE_URL ?? 'https://opencollective.com/bttr-go-playground'
  }
};

export default environment;
