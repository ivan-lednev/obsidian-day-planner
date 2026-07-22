export function liftToArray<T>(value: T | T[]) {
  return Array.isArray(value) ? value : [value];
}

export function isLastIndexOf(array: unknown[], index: number) {
  return index === array.length - 1;
}
