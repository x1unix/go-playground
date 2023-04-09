export const pathSeparator = '/';

export const trimSlash = (path: string) => path[0] === pathSeparator ? (
  path.slice(1)
) : path;

const lastSlash = (s: string) => {
  for (let i = s.length - 1; i >= 0; i--) {
    if (s[i] === pathSeparator) {
      return i;
    }
  }

  return 0;
}

export const dirName = (path: string) => (
  path.slice(0, lastSlash(path))
);

export const baseName = (path: string) => (
  trimSlash(path.slice(lastSlash(path)))
);
