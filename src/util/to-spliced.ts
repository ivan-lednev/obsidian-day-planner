export function toSpliced<T>(array: T[], index: number, el: T) {
  if (index < 0) {
    throw new Error(`Cannot use negative indexes for splcing`);
  }

  const copy = [...array];
  copy[index] = el;

  return copy;
}
