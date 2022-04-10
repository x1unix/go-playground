const query = '(prefers-color-scheme)';

export const supportsPreferColorScheme = () => {
  if (!('matchMedia' in window)) {
    return false;
  }

  // See: https://kilianvalkhof.com/2021/web/detecting-media-query-support-in-css-and-javascript/
  const { media } = window.matchMedia(query);
  return media === query;
};

export const isDarkModeEnabled = () => {
  if (!supportsPreferColorScheme()) {
    return false;
  }

  const { matches } = window.matchMedia('(prefers-color-scheme: dark)');
  return matches;
}
