export function createProp(key: string, value: string) {
  return `[${key}::${value}]`;
}

export function updateProp(
  line: string,
  updateFn: (previous: string) => string,
) {
  // todo: move out
  const propValueRegexp = /\[(.+)::(.*)]/;
  const [, key, previous] = propValueRegexp.exec(line);

  return `[${key}::${updateFn(previous)}]`;
}
