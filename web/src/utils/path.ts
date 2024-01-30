export const trimSuffix = (s: string, suffix: string): string => (s.endsWith(suffix) ? s.slice(0, -suffix.length) : s)
