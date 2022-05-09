export type Nullable<T> = T | null;

/**
 * Returns a new object without specified keys
 * @param obj Object
 * @param keys List of keys to exclude
 */
export const excludeKeys = <T = any, R = Partial<T>>(obj: T, ...keys: Array<keyof T>): R => {
  if (!obj) return (obj as unknown) as R;
  switch (keys.length) {
    case 0:
      return (obj as unknown) as R;
    case 1:
      const newObj = { ...obj };
      const [ key ] = keys;
      delete newObj[key];
      return (obj as unknown) as R;
    default:
      const keysList = new Set(keys as string[]);
      return Object.fromEntries(
        Object.entries(obj).filter(([key]) => !keysList.has(key))
      ) as R;
  }
}
