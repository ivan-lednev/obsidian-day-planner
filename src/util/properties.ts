import { propRegexp } from "../regexp";

export function createProp(key: string, value: string) {
  return `[${key}::${value}]`;
}

export function updateProp(
  line: string,
  updateFn: (previous: string) => string,
) {
  // TODO: move out
  const [, key, previous] = propRegexp.exec(line);

  return `[${key}::${updateFn(previous)}]`;
}

export function deleteProps(line: string) {
  return line.replaceAll(propRegexp, "").trim();
}
