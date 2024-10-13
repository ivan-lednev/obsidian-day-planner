export function toSpliced<T>(array: T[], index: number, el: T) {
  if (index < 0) {
    throw new Error(`Cannot use negative indexes for splicing`);
  }

  const copy = [...array];
  copy[index] = el;

  return copy;
}
