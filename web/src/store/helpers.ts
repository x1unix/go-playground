import { Action, ActionType } from './actions';

export type Reducer<S, T> = (s: S, a: Action<T>) => S;
export type ActionReducers<T> = { [k in keyof typeof ActionType | string]: Reducer<T, any> };

/**
 * Maps reducers by action type
 * @param reducers Key value pair of action type and reducer
 * @param initialState Initial state
 */
export function mapByAction<T>(reducers: ActionReducers<T>, initialState: T): Reducer<T, any> {
  return (state: T = initialState, action: Action) => {
    if (reducers[action.type]) {
      const newState = { ...state };
      return reducers[action.type](newState, action);
    }

    return state;
  };
}

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
