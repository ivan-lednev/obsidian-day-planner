export function liftToArray<T>(value: T | T[]) {
  return Array.isArray(value) ? value : [value];
}
