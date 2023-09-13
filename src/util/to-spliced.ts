export function toSpliced<T>(array: T[], index: number, el: T) {
  const copy = [...array];
  copy[index] = el;

  return copy;
}
