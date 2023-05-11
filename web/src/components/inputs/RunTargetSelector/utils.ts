const majorVersionRegex = /^(\d+\.\d+)(.*)$/;

/**
 * Returns a new string which contains only major and minor version
 * from semver string.
 *
 * Returns the original string if it's not a semver string.
 *
 * @param str Semver string
 */
export const removePatchVersion = (str: string): string => (
  str.replace(majorVersionRegex, (match, ...groups) => (
    groups?.length ? groups[0] : match
  ))
);
